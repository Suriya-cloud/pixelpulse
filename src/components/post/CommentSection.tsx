import React, { useState, useEffect } from 'react';
import { Heart, Trash2, CornerDownRight, Send } from 'lucide-react';
import type { Comment } from '../../types/post';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import { formatTimeAgo } from '../../utils/dateUtils';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyToParentId, setReplyToParentId] = useState<string | null>(null);
  const [replyToUsername, setReplyToUsername] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadComments() {
      setLoading(true);
      try {
        const data = await commentService.getPostComments(postId, user?.id);
        setComments(data);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadComments();
  }, [postId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCommentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const added = await commentService.addComment(
        postId,
        user,
        newCommentText,
        replyToParentId || undefined
      );

      if (replyToParentId) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === replyToParentId) {
              return { ...c, replies: [...(c.replies || []), added] };
            }
            return c;
          })
        );
      } else {
        setComments((prev) => [...prev, added]);
      }

      setNewCommentText('');
      setReplyToParentId(null);
      setReplyToUsername(null);
      onCommentAdded?.();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;
    try {
      const isLiked = await commentService.toggleCommentLike(commentId, user.id);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              is_liked: isLiked,
              likes_count: Math.max(0, c.likes_count + (isLiked ? 1 : -1)),
            };
          }
          if (c.replies) {
            const updatedReplies = c.replies.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    is_liked: isLiked,
                    likes_count: Math.max(0, r.likes_count + (isLiked ? 1 : -1)),
                  }
                : r
            );
            return { ...c, replies: updatedReplies };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      await commentService.deleteComment(commentId, user.id);
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: (c.replies || []).filter((r) => r.id !== commentId),
          }))
      );
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-96">
        {loading ? (
          <div className="text-center py-6 text-xs text-neutral-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-neutral-400">
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Parent Comment */}
              <div className="flex items-start justify-between gap-3 group">
                <Avatar
                  src={comment.user?.avatar_url}
                  username={comment.user?.username || 'user'}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-900 dark:text-neutral-100">
                    <span className="font-bold mr-1.5">@{comment.user?.username}</span>
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 font-medium">
                    <span>{formatTimeAgo(comment.created_at)}</span>
                    {comment.likes_count > 0 && <span>{comment.likes_count} likes</span>}
                    <button
                      onClick={() => {
                        setReplyToParentId(comment.id);
                        setReplyToUsername(comment.user?.username || 'user');
                      }}
                      className="hover:underline text-neutral-600 dark:text-neutral-400 font-semibold"
                    >
                      Reply
                    </button>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-rose-500 opacity-0 group-hover:opacity-100 hover:underline transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 inline" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={`p-1 transition-colors ${
                    comment.is_liked ? 'text-rose-500' : 'text-neutral-400 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${comment.is_liked ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* Reply Comments */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-6 space-y-2.5 border-l-2 border-neutral-200 dark:border-neutral-800 ml-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start justify-between gap-3 group">
                      <div className="flex items-center gap-2">
                        <CornerDownRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        <Avatar
                          src={reply.user?.avatar_url}
                          username={reply.user?.username || 'user'}
                          size="xs"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-900 dark:text-neutral-100">
                          <span className="font-bold mr-1.5">@{reply.user?.username}</span>
                          {reply.content}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 font-medium">
                          <span>{formatTimeAgo(reply.created_at)}</span>
                          {reply.likes_count > 0 && <span>{reply.likes_count} likes</span>}
                          {user?.id === reply.user_id && (
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="text-rose-500 opacity-0 group-hover:opacity-100 hover:underline transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 inline" />
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLikeComment(reply.id)}
                        className={`p-1 transition-colors ${
                          reply.is_liked ? 'text-rose-500' : 'text-neutral-400 hover:text-rose-500'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${reply.is_liked ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply Banner Indicator */}
      {replyToUsername && (
        <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-neutral-600 dark:text-neutral-300">
          <span>
            Replying to <span className="font-bold">@{replyToUsername}</span>
          </span>
          <button
            onClick={() => {
              setReplyToParentId(null);
              setReplyToUsername(null);
            }}
            className="text-rose-500 font-semibold hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Add Comment Input Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <Avatar src={user.avatar_url} username={user.username} size="xs" />
          <input
            type="text"
            placeholder={replyToUsername ? `Reply to @${replyToUsername}...` : 'Add a comment...'}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="flex-1 bg-neutral-100 dark:bg-neutral-900 border-none text-xs rounded-xl px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || submitting}
            className="p-2 rounded-xl text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 disabled:opacity-40 transition-colors font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="text-center py-2 text-xs text-neutral-400">
          Log in to leave a comment
        </div>
      )}
    </div>
  );
};

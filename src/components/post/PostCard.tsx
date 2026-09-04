import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Trash2,
  Check,
  Copy,
} from 'lucide-react';
import type { Post } from '../../types/post';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import { PostCarousel } from './PostCarousel';
import { formatTimeAgo } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onSave, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const handleDoubleTap = () => {
    if (!post.is_liked) {
      onLike(post.id);
    }
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 800);
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by @${post.user.username} on PixelPulse`,
          text: post.caption || 'Check out this post on PixelPulse!',
          url: postUrl,
        });
        return;
      } catch {
        // Fallback to share modal
      }
    }
    setShowShareModal(true);
  };

  const copyPostLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <article className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-3xl shadow-sm overflow-hidden mb-6 transition-all">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800/40">
        <div
          onClick={() => navigate(`/profile/${post.user.username}`)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Avatar
            src={post.user.avatar_url}
            username={post.user.username}
            size="sm"
            showRing
          />
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-violet-600 transition-colors">
              @{post.user.username}
            </h4>
            {post.location && (
              <p className="flex items-center gap-1 text-[11px] text-neutral-500 font-medium">
                <MapPin className="w-3 h-3 text-violet-500" />
                <span>{post.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu((prev) => !prev)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showOptionsMenu && (
            <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl py-1 animate-scale-up">
              <button
                onClick={() => {
                  setShowOptionsMenu(false);
                  handleShare();
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Share Post
              </button>
              {user?.id === post.user_id && onDelete && (
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onDelete(post.id);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Carousel & Double-Tap Heart Overlay */}
      <div className="relative">
        <PostCarousel media={post.media} onDoubleTap={handleDoubleTap} />

        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart className="w-24 h-24 text-white fill-rose-500 drop-shadow-2xl animate-ping" />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 transition-transform active:scale-125 ${
                post.is_liked
                  ? 'text-rose-500'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-rose-500' : ''}`} />
              <span className="text-xs font-bold">{formatNumber(post.likes_count)}</span>
            </button>

            <button
              onClick={() => setShowCommentsModal(true)}
              className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-violet-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs font-bold">{formatNumber(post.comments_count)}</span>
            </button>

            <button
              onClick={handleShare}
              className="text-neutral-700 dark:text-neutral-300 hover:text-violet-500 transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={() => onSave(post.id)}
            className={`transition-colors ${
              post.is_saved
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-violet-500'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${post.is_saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed">
            <span
              onClick={() => navigate(`/profile/${post.user.username}`)}
              className="font-bold mr-2 cursor-pointer hover:underline"
            >
              @{post.user.username}
            </span>
            {post.caption}
          </p>
        )}

        {/* View Comments Link */}
        {post.comments_count > 0 && (
          <button
            onClick={() => setShowCommentsModal(true)}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            View all {post.comments_count} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {formatTimeAgo(post.created_at)}
        </p>
      </div>

      {/* Comments Drawer Modal */}
      <Modal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        title="Comments"
        maxWidth="lg"
      >
        <CommentSection
          postId={post.id}
          onCommentAdded={() => {
            post.comments_count += 1;
          }}
        />
      </Modal>

      {/* Share Post Dialog */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Post"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">Copy the direct link to share this post:</p>
          <div className="flex items-center gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/post/${post.id}`}
              className="flex-1 bg-transparent text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none border-none"
            />
            <button
              onClick={copyPostLink}
              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </article>
  );
};

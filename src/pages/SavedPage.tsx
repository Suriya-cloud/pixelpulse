import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { postService } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';
import type { Post } from '../types/post';
import { PostCard } from '../components/post/PostCard';

export const SavedPage: React.FC = () => {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      if (!user) return;
      setLoading(true);
      try {
        const posts = await postService.getSavedPosts(user.id);
        setSavedPosts(posts);
      } catch (err) {
        console.error('Failed to load saved posts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSaved();
  }, [user]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    setSavedPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: Math.max(0, p.likes_count + (p.is_liked ? -1 : 1)),
            }
          : p
      )
    );
    await postService.toggleLikePost(postId, user);
  };

  const handleSave = async (postId: string) => {
    if (!user) return;
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
    await postService.toggleSavePost(postId, user.id);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <Bookmark className="w-5 h-5 text-violet-500" />
        <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
          Saved Posts
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-neutral-400">Loading saved posts...</div>
      ) : savedPosts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 space-y-3">
          <Bookmark className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            No Saved Posts
          </h3>
          <p className="text-xs text-neutral-500">
            Save photos you want to see again. Only you can see what you've saved.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

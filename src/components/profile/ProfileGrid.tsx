import React, { useState } from 'react';
import { Grid, Bookmark, Heart, MessageCircle, Layers } from 'lucide-react';
import type { Post } from '../../types/post';
import { Modal } from '../common/Modal';
import { PostCard } from '../post/PostCard';

interface ProfileGridProps {
  posts: Post[];
  savedPosts?: Post[];
  isOwnProfile: boolean;
  onLikePost: (postId: string) => void;
  onSavePost: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  posts,
  savedPosts = [],
  isOwnProfile,
  onLikePost,
  onSavePost,
  onDeletePost,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const displayPosts = activeTab === 'posts' ? posts : savedPosts;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center justify-center border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 px-6 text-xs font-bold uppercase tracking-wider transition-colors border-t-2 ${
            activeTab === 'posts'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts ({posts.length})</span>
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-3 px-6 text-xs font-bold uppercase tracking-wider transition-colors border-t-2 ${
              activeTab === 'saved'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved ({savedPosts.length})</span>
          </button>
        )}
      </div>

      {/* Grid Content */}
      {displayPosts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            {activeTab === 'posts' ? <Grid className="w-8 h-8" /> : <Bookmark className="w-8 h-8" />}
          </div>
          <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {activeTab === 'posts' ? 'No Posts Yet' : 'No Saved Posts'}
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {activeTab === 'posts'
              ? 'When photos are uploaded, they will appear here.'
              : 'Only you can see what you have saved.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          {displayPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group select-none"
            >
              <img
                src={post.media?.[0]?.media_url}
                alt="Post thumbnail"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {/* Multi-image indicator badge */}
              {post.media?.length > 1 && (
                <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white backdrop-blur-sm pointer-events-none">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Hover Overlay with engagement metrics */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-bold transition-opacity duration-200">
                <span className="flex items-center gap-1 text-xs">
                  <Heart className="w-4 h-4 fill-white" />
                  {post.likes_count}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  {post.comments_count}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Single Post Modal */}
      {selectedPost && (
        <Modal
          isOpen={Boolean(selectedPost)}
          onClose={() => setSelectedPost(null)}
          maxWidth="lg"
        >
          <PostCard
            post={selectedPost}
            onLike={onLikePost}
            onSave={onSavePost}
            onDelete={onDeletePost}
          />
        </Modal>
      )}
    </div>
  );
};

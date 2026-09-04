import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, UserPlus } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { useAuth } from '../contexts/AuthContext';
import { PostCard } from '../components/post/PostCard';
import { PostSkeleton } from '../components/common/Skeleton';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { userService } from '../services/userService';
import { followService } from '../services/followService';
import type { UserProfile } from '../types/user';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    posts,
    loading,
    refreshing,
    hasMore,
    refreshFeed,
    loadMore,
    toggleLike,
    toggleSave,
    deletePost,
  } = useFeed();

  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (user) {
      userService.getSuggestedUsers(user.id, 4).then(setSuggestedUsers);
    }
  }, [user]);

  const handleFollowSuggested = async (suggestedId: string) => {
    if (!user) return;
    await followService.followUser(user.id, suggestedId);
    setSuggestedUsers((prev) => prev.filter((u) => u.id !== suggestedId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Main Feed Column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Top Feed Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span>Feed</span>
          </h2>

          <button
            onClick={refreshFeed}
            disabled={refreshing}
            className="p-2 rounded-xl text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feed Posts */}
        {loading && posts.length === 0 ? (
          <div className="space-y-6">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Your Feed is Empty
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              Follow creators or publish your first post to start filling your home feed with awesome visual updates!
            </p>
            <Button onClick={() => navigate('/explore')} size="md">
              Explore Creators
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={toggleLike}
                onSave={toggleSave}
                onDelete={deletePost}
              />
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <Button variant="outline" size="sm" onClick={loadMore} isLoading={loading}>
                  Load More Posts
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Right Sidebar: Suggested Creators */}
      <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-6">
        {user && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div
                onClick={() => navigate(`/profile/${user.username}`)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Avatar src={user.avatar_url} username={user.username} size="md" showRing />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {user.display_name || user.username}
                  </h4>
                  <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Creators Widget */}
        {suggestedUsers.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Suggested Creators
              </h3>
              <button
                onClick={() => navigate('/explore')}
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
              >
                See All
              </button>
            </div>

            <div className="space-y-3">
              {suggestedUsers.map((su) => (
                <div key={su.id} className="flex items-center justify-between gap-3">
                  <div
                    onClick={() => navigate(`/profile/${su.username}`)}
                    className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                  >
                    <Avatar src={su.avatar_url} username={su.username} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        @{su.username}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">{su.display_name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFollowSuggested(su.id)}
                    className="p-1.5 rounded-xl text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, UserPlus, Heart, MessageCircle, Layers } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { followService } from '../services/followService';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types/user';
import type { Post } from '../types/post';
import { Avatar } from '../components/common/Avatar';
import { Modal } from '../components/common/Modal';
import { PostCard } from '../components/post/PostCard';

export const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    async function loadExploreData() {
      if (!user) return;
      setLoadingPosts(true);
      try {
        const posts = await postService.getExplorePosts(user.id);
        setExplorePosts(posts);
      } catch (err) {
        console.error('Failed to load explore posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    }
    loadExploreData();
  }, [user]);

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const results = await userService.searchUsers(debouncedQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search query error:', err);
      } finally {
        setSearching(false);
      }
    }
    performSearch();
  }, [debouncedQuery]);

  const handleFollowSearchUser = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await followService.followUser(user.id, targetId);
    setSearchResults((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, is_following: true } : u))
    );
  };

  const handleLikeExplorePost = async (postId: string) => {
    if (!user) return;
    setExplorePosts((prev) =>
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

  const handleSaveExplorePost = async (postId: string) => {
    if (!user) return;
    setExplorePosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_saved: !p.is_saved } : p))
    );
    await postService.toggleSavePost(postId, user.id);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search usernames, creators, or handles (e.g. @suriya_dev)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Live Search Results Container */}
      {searchQuery.trim() !== '' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 shadow-lg space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-2">
            Search Results
          </h3>

          {searching ? (
            <p className="text-xs text-neutral-400 p-3">Searching creators...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-xs text-neutral-400 p-3">No creators found matching "{searchQuery}"</p>
          ) : (
            <div className="space-y-1">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => navigate(`/profile/${result.username}`)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={result.avatar_url} username={result.username} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        @{result.username}
                      </h4>
                      <p className="text-xs text-neutral-500">{result.display_name}</p>
                    </div>
                  </div>

                  {user && user.id !== result.id && (
                    <button
                      onClick={(e) => handleFollowSearchUser(result.id, e)}
                      className="px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold hover:bg-violet-500/20 flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{result.is_following ? 'Following' : 'Follow'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explore Grid Header */}
      <div className="flex items-center gap-2 pt-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <Compass className="w-5 h-5 text-violet-500" />
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
          Discover & Explore
        </h2>
      </div>

      {/* Explore Grid */}
      {loadingPosts ? (
        <div className="grid grid-cols-3 gap-2 animate-pulse">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square bg-neutral-300 dark:bg-neutral-800 rounded-2xl" />
          ))}
        </div>
      ) : explorePosts.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 text-xs">
          No explore posts available right now.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {explorePosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square bg-neutral-900 rounded-2xl overflow-hidden cursor-pointer group select-none"
            >
              <img
                src={post.media?.[0]?.media_url}
                alt="Explore post thumbnail"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {post.media?.length > 1 && (
                <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white backdrop-blur-sm pointer-events-none">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              )}

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

      {/* Selected Post Modal */}
      {selectedPost && (
        <Modal
          isOpen={Boolean(selectedPost)}
          onClose={() => setSelectedPost(null)}
          maxWidth="lg"
        >
          <PostCard
            post={selectedPost}
            onLike={handleLikeExplorePost}
            onSave={handleSaveExplorePost}
          />
        </Modal>
      )}
    </div>
  );
};

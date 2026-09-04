import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../types/post';
import { postService } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';

export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  const fetchFeed = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const targetPage = isRefresh ? 1 : page;
        const newPosts = await postService.getFeedPosts(user.id, targetPage, 10);

        if (isRefresh) {
          setPosts(newPosts);
          setPage(1);
          setHasMore(newPosts.length >= 10);
        } else {
          setPosts((prev) => (targetPage === 1 ? newPosts : [...prev, ...newPosts]));
          setHasMore(newPosts.length >= 10);
        }
      } catch (err) {
        console.error('Failed to load feed posts:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, page]
  );

  useEffect(() => {
    fetchFeed(true);
  }, [user]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  const toggleLike = async (postId: string) => {
    if (!user) return;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.is_liked;
          return {
            ...p,
            is_liked: isLiked,
            likes_count: Math.max(0, p.likes_count + (isLiked ? 1 : -1)),
          };
        }
        return p;
      })
    );

    try {
      await postService.toggleLikePost(postId, user);
    } catch (err) {
      console.error('Like toggle failed, reverting:', err);
      // Revert optimistic update
      fetchFeed(true);
    }
  };

  const toggleSave = async (postId: string) => {
    if (!user) return;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_saved: !p.is_saved } : p))
    );

    try {
      await postService.toggleSavePost(postId, user.id);
    } catch (err) {
      console.error('Save toggle failed:', err);
      fetchFeed(true);
    }
  };

  const addCreatedPost = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await postService.deletePost(postId, user.id);
  };

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    refreshFeed: () => fetchFeed(true),
    loadMore,
    toggleLike,
    toggleSave,
    addCreatedPost,
    deletePost,
  };
}

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Post, PostMedia } from '../types/post';
import type { UserProfile } from '../types/user';
import { notificationService } from './notificationService';

const LOCAL_POSTS_KEY = 'pixelpulse_all_posts';
const LOCAL_SAVED_KEY = 'pixelpulse_saved_posts';
const LOCAL_LIKES_KEY = 'pixelpulse_liked_posts';

const INITIAL_SEED_POSTS: Post[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    caption: 'Welcome to PixelPulse! ✨ A next-gen social platform built with React, TypeScript, and Supabase featuring real-time updates and ultra-clean UI.',
    location: 'Bengaluru, India',
    likes_count: 142,
    comments_count: 2,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'suriya_dev',
      display_name: 'Suriya K.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      bio: 'Full-stack Engineer & Visual Designer 🚀 | Creator of PixelPulse',
      posts_count: 3,
      followers_count: 1420,
      following_count: 350,
      created_at: new Date().toISOString(),
    },
    media: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        post_id: '10000000-0000-0000-0000-000000000001',
        media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        aspect_ratio: 1.0,
        order_index: 0,
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0000-000000000002',
    caption: 'Golden hour architecture reflections in downtown SF. Swipe for detail shots! 🌇',
    location: 'San Francisco, CA',
    likes_count: 389,
    comments_count: 24,
    created_at: new Date(Date.now() - 18000000).toISOString(),
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      username: 'alex_design',
      display_name: 'Alex Rivera',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      bio: 'UI/UX Lead & Minimalist Photographer 📷',
      posts_count: 4,
      followers_count: 2890,
      following_count: 412,
      created_at: new Date().toISOString(),
    },
    media: [
      {
        id: '20000000-0000-0000-0000-000000000002',
        post_id: '10000000-0000-0000-0000-000000000002',
        media_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        aspect_ratio: 1.0,
        order_index: 0,
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        post_id: '10000000-0000-0000-0000-000000000002',
        media_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        aspect_ratio: 1.0,
        order_index: 1,
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    user_id: '00000000-0000-0000-0000-000000000003',
    caption: 'Cyberpunk neon aesthetics render completed in Blender. What do you think? 🌌',
    location: 'Tokyo, Japan',
    likes_count: 521,
    comments_count: 38,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user: {
      id: '00000000-0000-0000-0000-000000000003',
      username: 'maya_art',
      display_name: 'Maya Lin',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      bio: 'Digital Artist & 3D Creator 🎨',
      posts_count: 2,
      followers_count: 980,
      following_count: 180,
      created_at: new Date().toISOString(),
    },
    media: [
      {
        id: '20000000-0000-0000-0000-000000000004',
        post_id: '10000000-0000-0000-0000-000000000003',
        media_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        aspect_ratio: 1.0,
        order_index: 0,
      },
    ],
  },
];

function getStoredPosts(): Post[] {
  const stored = localStorage.getItem(LOCAL_POSTS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(INITIAL_SEED_POSTS));
    return INITIAL_SEED_POSTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SEED_POSTS;
  }
}

export function saveStoredPosts(posts: Post[]) {
  localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
}

export const postService = {
  async getFeedPosts(currentUserId: string, page = 1, limit = 10): Promise<Post[]> {
    if (isSupabaseConfigured) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!user_id(*),
          media:post_media(*)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error || !posts) return [];

      // Annotate with is_liked and is_saved
      return this.annotateUserPostState(posts, currentUserId);
    }

    // Local fallback
    const posts = getStoredPosts();
    const paginated = posts.slice((page - 1) * limit, page * limit);
    return this.annotateUserPostState(paginated, currentUserId);
  },

  async getExplorePosts(currentUserId: string): Promise<Post[]> {
    if (isSupabaseConfigured) {
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!user_id(*),
          media:post_media(*)
        `)
        .order('likes_count', { ascending: false })
        .limit(30);

      return this.annotateUserPostState(posts || [], currentUserId);
    }

    const posts = getStoredPosts();
    // Sort by popular engagement signals
    const sorted = [...posts].sort((a, b) => b.likes_count - a.likes_count);
    return this.annotateUserPostState(sorted, currentUserId);
  },

  async getUserPosts(userId: string, currentUserId: string): Promise<Post[]> {
    if (isSupabaseConfigured) {
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!user_id(*),
          media:post_media(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return this.annotateUserPostState(posts || [], currentUserId);
    }

    const posts = getStoredPosts();
    const userPosts = posts.filter((p) => p.user_id === userId);
    return this.annotateUserPostState(userPosts, currentUserId);
  },

  async getSavedPosts(currentUserId: string): Promise<Post[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('saved_posts')
        .select(`
          post:posts(
            *,
            user:profiles!user_id(*),
            media:post_media(*)
          )
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      const posts = (data || []).map((item: any) => item.post).filter(Boolean);
      return this.annotateUserPostState(posts, currentUserId);
    }

    // Local fallback
    const savedIds: string[] = JSON.parse(
      localStorage.getItem(`${LOCAL_SAVED_KEY}_${currentUserId}`) || '[]'
    );
    const posts = getStoredPosts().filter((p) => savedIds.includes(p.id));
    return this.annotateUserPostState(posts, currentUserId);
  },

  async getPostById(postId: string, currentUserId: string): Promise<Post | null> {
    if (isSupabaseConfigured) {
      const { data: post } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!user_id(*),
          media:post_media(*)
        `)
        .eq('id', postId)
        .single();

      if (!post) return null;
      const annotated = await this.annotateUserPostState([post], currentUserId);
      return annotated[0] || null;
    }

    const posts = getStoredPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) return null;
    const annotated = await this.annotateUserPostState([post], currentUserId);
    return annotated[0] || null;
  },

  async createPost(
    currentUser: UserProfile,
    caption: string,
    mediaUrls: { url: string; aspectRatio: number }[],
    location?: string
  ): Promise<Post> {
    if (mediaUrls.length === 0) throw new Error('At least one image is required');

    if (isSupabaseConfigured) {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          caption: caption.trim() || null,
          location: location?.trim() || null,
        })
        .select(`
          *,
          user:profiles!user_id(*)
        `)
        .single();

      if (error || !post) throw new Error(error?.message || 'Failed to create post');

      // Insert media items
      const mediaInserts = mediaUrls.map((m, idx) => ({
        post_id: post.id,
        media_url: m.url,
        aspect_ratio: m.aspectRatio || 1.0,
        order_index: idx,
      }));

      const { data: media, error: mediaErr } = await supabase
        .from('post_media')
        .insert(mediaInserts)
        .select();

      if (mediaErr) console.error('Media upload error:', mediaErr);

      post.media = media || [];
      return post;
    }

    // Local fallback
    const posts = getStoredPosts();
    const newPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const mediaList: PostMedia[] = mediaUrls.map((m, idx) => ({
      id: `media_${Date.now()}_${idx}`,
      post_id: newPostId,
      media_url: m.url,
      media_type: 'image',
      aspect_ratio: m.aspectRatio || 1.0,
      order_index: idx,
    }));

    const newPost: Post = {
      id: newPostId,
      user_id: currentUser.id,
      caption: caption.trim() || null,
      location: location?.trim() || null,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      user: currentUser,
      media: mediaList,
      is_liked: false,
      is_saved: false,
    };

    posts.unshift(newPost);
    saveStoredPosts(posts);
    return newPost;
  },

  async deletePost(postId: string, currentUserId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', currentUserId);

      if (error) throw new Error(error.message);
      return;
    }

    let posts = getStoredPosts();
    posts = posts.filter((p) => p.id !== postId);
    saveStoredPosts(posts);
  },

  async toggleLikePost(postId: string, currentUser: UserProfile): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data: existing } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .single();

      if (existing) {
        await supabase.from('likes').delete().eq('id', existing.id);
        return false;
      } else {
        await supabase.from('likes').insert({
          post_id: postId,
          user_id: currentUser.id,
        });
        return true;
      }
    }

    // Local fallback
    const key = `${LOCAL_LIKES_KEY}_${currentUser.id}`;
    const likedPosts: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const index = likedPosts.indexOf(postId);
    let isLiked = false;

    if (index > -1) {
      likedPosts.splice(index, 1);
      isLiked = false;
    } else {
      likedPosts.push(postId);
      isLiked = true;
    }

    localStorage.setItem(key, JSON.stringify(likedPosts));

    // Update count in post
    const posts = getStoredPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.likes_count = Math.max(0, post.likes_count + (isLiked ? 1 : -1));
      saveStoredPosts(posts);

      if (isLiked && post.user_id !== currentUser.id) {
        notificationService.createNotification({
          recipient_id: post.user_id,
          actor_id: currentUser.id,
          type: 'like',
          post_id: postId,
          actor: currentUser,
          post,
        });
      }
    }

    return isLiked;
  },

  async toggleSavePost(postId: string, currentUserId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data: existing } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .single();

      if (existing) {
        await supabase.from('saved_posts').delete().eq('id', existing.id);
        return false;
      } else {
        await supabase.from('saved_posts').insert({
          post_id: postId,
          user_id: currentUserId,
        });
        return true;
      }
    }

    // Local fallback
    const key = `${LOCAL_SAVED_KEY}_${currentUserId}`;
    const savedPosts: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const index = savedPosts.indexOf(postId);
    let isSaved = false;

    if (index > -1) {
      savedPosts.splice(index, 1);
      isSaved = false;
    } else {
      savedPosts.push(postId);
      isSaved = true;
    }

    localStorage.setItem(key, JSON.stringify(savedPosts));
    return isSaved;
  },

  async annotateUserPostState(posts: Post[], currentUserId: string): Promise<Post[]> {
    if (!currentUserId) return posts;

    if (isSupabaseConfigured) {
      const postIds = posts.map((p) => p.id);
      if (postIds.length === 0) return posts;

      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      const { data: userSaves } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      const likedSet = new Set((userLikes || []).map((l: any) => l.post_id));
      const savedSet = new Set((userSaves || []).map((s: any) => s.post_id));

      return posts.map((p) => ({
        ...p,
        is_liked: likedSet.has(p.id),
        is_saved: savedSet.has(p.id),
      }));
    }

    // Local fallback
    const likedPosts: string[] = JSON.parse(
      localStorage.getItem(`${LOCAL_LIKES_KEY}_${currentUserId}`) || '[]'
    );
    const savedPosts: string[] = JSON.parse(
      localStorage.getItem(`${LOCAL_SAVED_KEY}_${currentUserId}`) || '[]'
    );

    return posts.map((p) => ({
      ...p,
      is_liked: likedPosts.includes(p.id),
      is_saved: savedPosts.includes(p.id),
    }));
  },
};

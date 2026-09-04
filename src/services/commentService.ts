import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Comment } from '../types/post';
import type { UserProfile } from '../types/user';
import { notificationService } from './notificationService';

const LOCAL_COMMENTS_KEY = 'pixelpulse_comments';

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    post_id: '10000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000002',
    content: 'This UI looks insanely clean! Congrats on the build 🔥',
    likes_count: 5,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      username: 'alex_design',
      display_name: 'Alex Rivera',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      bio: null,
      posts_count: 4,
      followers_count: 2890,
      following_count: 412,
      created_at: new Date().toISOString(),
    },
    replies: [
      {
        id: '30000000-0000-0000-0000-000000000003',
        post_id: '10000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000001',
        parent_id: '30000000-0000-0000-0000-000000000001',
        content: 'Thanks Alex! Appreciate the feedback. 🔥',
        likes_count: 2,
        created_at: new Date(Date.now() - 1800000).toISOString(),
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          username: 'suriya_dev',
          display_name: 'Suriya K.',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          bio: null,
          posts_count: 3,
          followers_count: 1420,
          following_count: 350,
          created_at: new Date().toISOString(),
        },
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    post_id: '10000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000003',
    content: 'Love the dark mode theme and glassmorphic elements!',
    likes_count: 3,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    user: {
      id: '00000000-0000-0000-0000-000000000003',
      username: 'maya_art',
      display_name: 'Maya Lin',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      bio: null,
      posts_count: 2,
      followers_count: 980,
      following_count: 180,
      created_at: new Date().toISOString(),
    },
  },
];

function getStoredComments(): Comment[] {
  const stored = localStorage.getItem(LOCAL_COMMENTS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(DEFAULT_COMMENTS));
    return DEFAULT_COMMENTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_COMMENTS;
  }
}

function saveStoredComments(comments: Comment[]) {
  localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments));
}

export const commentService = {
  async getPostComments(postId: string, _currentUserId?: string): Promise<Comment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!user_id(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      // Structure top-level and nested replies
      const topLevel: Comment[] = [];
      const repliesMap: Record<string, Comment[]> = {};

      data.forEach((item: any) => {
        if (item.parent_id) {
          if (!repliesMap[item.parent_id]) repliesMap[item.parent_id] = [];
          repliesMap[item.parent_id].push(item);
        } else {
          topLevel.push(item);
        }
      });

      topLevel.forEach((c) => {
        c.replies = repliesMap[c.id] || [];
      });

      return topLevel;
    }

    // Local fallback
    const all = getStoredComments();
    const postComments = all.filter((c) => c.post_id === postId);

    // Structure parent/replies
    const topLevel = postComments.filter((c) => !c.parent_id);
    topLevel.forEach((parent) => {
      parent.replies = postComments.filter((r) => r.parent_id === parent.id);
    });

    return topLevel;
  },

  async addComment(
    postId: string,
    currentUser: UserProfile,
    content: string,
    parentId?: string
  ): Promise<Comment> {
    if (!content.trim()) throw new Error('Comment text cannot be empty');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          parent_id: parentId || null,
          content: content.trim(),
        })
        .select(`
          *,
          user:profiles!user_id(*)
        `)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    // Local fallback
    const all = getStoredComments();
    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      post_id: postId,
      user_id: currentUser.id,
      parent_id: parentId || null,
      content: content.trim(),
      likes_count: 0,
      created_at: new Date().toISOString(),
      user: currentUser,
      replies: [],
    };

    all.push(newComment);
    saveStoredComments(all);

    // Create notification if comment on someone else's post/comment
    notificationService.createNotification({
      recipient_id: currentUser.id, // Notification recipient placeholder
      actor_id: currentUser.id,
      type: parentId ? 'reply' : 'comment',
      post_id: postId,
      actor: currentUser,
    });

    return newComment;
  },

  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      return;
    }

    let all = getStoredComments();
    all = all.filter((c) => c.id !== commentId && c.parent_id !== commentId);
    saveStoredComments(all);
  },

  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data: existing } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        await supabase.from('comment_likes').delete().eq('id', existing.id);
        return false;
      } else {
        await supabase.from('comment_likes').insert({
          comment_id: commentId,
          user_id: userId,
        });
        return true;
      }
    }

    // Local fallback
    const key = `pixelpulse_comment_likes_${userId}`;
    const likedComments: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const index = likedComments.indexOf(commentId);
    let isLiked = false;

    if (index > -1) {
      likedComments.splice(index, 1);
      isLiked = false;
    } else {
      likedComments.push(commentId);
      isLiked = true;
    }

    localStorage.setItem(key, JSON.stringify(likedComments));

    // Update count in comment object
    const all = getStoredComments();
    const target = all.find((c) => c.id === commentId);
    if (target) {
      target.likes_count = Math.max(0, target.likes_count + (isLiked ? 1 : -1));
      saveStoredComments(all);
    }

    return isLiked;
  },
};

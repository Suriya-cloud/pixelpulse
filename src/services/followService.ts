import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/user';
import { notificationService } from './notificationService';

const LOCAL_USERS_KEY = 'pixelpulse_all_users';

function getStoredUsers(): UserProfile[] {
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export const followService = {
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) throw new Error('Cannot follow yourself');

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('follows').insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (error && error.code !== '23505') {
        throw new Error(error.message);
      }
      return;
    }

    // Local fallback
    const key = `pixelpulse_follows_${followerId}`;
    const follows: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!follows.includes(followingId)) {
      follows.push(followingId);
      localStorage.setItem(key, JSON.stringify(follows));

      // Update counters in local user state
      const users = getStoredUsers();
      const follower = users.find((u) => u.id === followerId);
      const target = users.find((u) => u.id === followingId);

      if (follower) follower.following_count += 1;
      if (target) target.followers_count += 1;

      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

      // Trigger follow notification
      if (target && follower) {
        notificationService.createNotification({
          recipient_id: target.id,
          actor_id: follower.id,
          type: 'follow',
          actor: follower,
        });
      }
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw new Error(error.message);
      return;
    }

    // Local fallback
    const key = `pixelpulse_follows_${followerId}`;
    let follows: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (follows.includes(followingId)) {
      follows = follows.filter((id) => id !== followingId);
      localStorage.setItem(key, JSON.stringify(follows));

      const users = getStoredUsers();
      const follower = users.find((u) => u.id === followerId);
      const target = users.find((u) => u.id === followingId);

      if (follower) follower.following_count = Math.max(0, follower.following_count - 1);
      if (target) target.followers_count = Math.max(0, target.followers_count - 1);

      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      return Boolean(data);
    }

    const key = `pixelpulse_follows_${followerId}`;
    const follows: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    return follows.includes(followingId);
  },

  async getFollowers(userId: string): Promise<UserProfile[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('follows')
        .select('profiles!follower_id(*)')
        .eq('following_id', userId);

      return (data || []).map((row: any) => row.profiles);
    }

    const users = getStoredUsers();
    // Simulate followers check
    return users.filter((u) => u.id !== userId);
  },

  async getFollowing(userId: string): Promise<UserProfile[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('follows')
        .select('profiles!following_id(*)')
        .eq('follower_id', userId);

      return (data || []).map((row: any) => row.profiles);
    }

    const key = `pixelpulse_follows_${userId}`;
    const follows: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const users = getStoredUsers();
    return users.filter((u) => follows.includes(u.id));
  },
};

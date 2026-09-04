import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/user';
import { saveStoredUsers } from './authService';

const LOCAL_USERS_KEY = 'pixelpulse_all_users';

function getStoredUsers(): UserProfile[] {
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export const userService = {
  async getProfileByUsername(username: string, currentUserId?: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single();

      if (error || !profile) return null;

      if (currentUserId && currentUserId !== profile.id) {
        const { data: follow } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', currentUserId)
          .eq('following_id', profile.id)
          .single();

        profile.is_following = Boolean(follow);
      }

      return profile;
    }

    // Local fallback
    const users = getStoredUsers();
    const profile = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!profile) return null;

    if (currentUserId && currentUserId !== profile.id) {
      const followsKey = `pixelpulse_follows_${currentUserId}`;
      const follows: string[] = JSON.parse(localStorage.getItem(followsKey) || '[]');
      profile.is_following = follows.includes(profile.id);
    }

    return profile;
  },

  async updateProfile(
    userId: string,
    updates: { username?: string; display_name?: string; bio?: string; avatar_url?: string }
  ): Promise<UserProfile> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    // Local fallback
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    if (updates.username && updates.username !== users[index].username) {
      const taken = users.some((u) => u.id !== userId && u.username.toLowerCase() === updates.username!.toLowerCase());
      if (taken) throw new Error('Username is already taken');
    }

    users[index] = {
      ...users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    saveStoredUsers(users);
    localStorage.setItem('pixelpulse_current_user', JSON.stringify(users[index]));
    return users[index];
  },

  async searchUsers(query: string): Promise<UserProfile[]> {
    if (!query.trim()) return [];

    const cleanQuery = query.toLowerCase().replace(/^@/, '');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
        .limit(20);

      if (error) return [];
      return data || [];
    }

    // Local fallback
    const users = getStoredUsers();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(cleanQuery) ||
        (u.display_name && u.display_name.toLowerCase().includes(cleanQuery))
    );
  },

  async getSuggestedUsers(currentUserId: string, limit = 5): Promise<UserProfile[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .order('followers_count', { ascending: false })
        .limit(limit);

      return data || [];
    }

    // Local fallback
    const users = getStoredUsers();
    return users.filter((u) => u.id !== currentUserId).slice(0, limit);
  },
};

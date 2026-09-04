import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/user';
import { validateUsernameFormat } from '../utils/formatters';

const LOCAL_AUTH_KEY = 'pixelpulse_current_user';
const LOCAL_USERS_KEY = 'pixelpulse_all_users';

// Default initial test users for local fallback
const DEFAULT_SEED_USERS: UserProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'suriya_dev',
    display_name: 'Suriya K.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    bio: 'Full-stack Engineer & Visual Designer 🚀 | Creator of PixelPulse',
    posts_count: 3,
    followers_count: 1420,
    following_count: 350,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    username: 'alex_design',
    display_name: 'Alex Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    bio: 'UI/UX Lead & Minimalist Photographer 📷 | San Francisco, CA',
    posts_count: 4,
    followers_count: 2890,
    following_count: 412,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    username: 'maya_art',
    display_name: 'Maya Lin',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    bio: 'Digital Artist & 3D Creator 🎨 | Capturing colors of the night',
    posts_count: 2,
    followers_count: 980,
    following_count: 180,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

function getStoredUsers(): UserProfile[] {
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_SEED_USERS));
    return DEFAULT_SEED_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SEED_USERS;
  }
}

export function saveStoredUsers(users: UserProfile[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export const authService = {
  // Convert username to internal Supabase email mapping format
  usernameToEmail(username: string): string {
    return `${username.toLowerCase().trim()}@pixelpulse.internal`;
  },

  async signUp(username: string, password: string, displayName?: string): Promise<UserProfile> {
    const val = validateUsernameFormat(username);
    if (!val.valid) throw new Error(val.message);

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const email = this.usernameToEmail(username);

    if (isSupabaseConfigured) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .single();

      if (existingProfile) {
        throw new Error('Username is already taken');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase().trim(),
            display_name: displayName || username,
          },
        },
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('User creation failed');

      // Fetch created profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        // Fallback profile if trigger delayed
        return {
          id: data.user.id,
          username: username.toLowerCase().trim(),
          display_name: displayName || username,
          avatar_url: null,
          bio: null,
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
          created_at: new Date().toISOString(),
        };
      }
      return profile;
    }

    // Local state fallback
    const users = getStoredUsers();
    const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      throw new Error('Username is already taken');
    }

    const newUser: UserProfile = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: username.toLowerCase().trim(),
      display_name: displayName || username,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: null,
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async signIn(username: string, password: string): Promise<UserProfile> {
    const val = validateUsernameFormat(username);
    if (!val.valid) throw new Error(val.message);

    const email = this.usernameToEmail(username);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error('Invalid username or password');

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        throw new Error('User profile not found');
      }
      return profile;
    }

    // Local fallback
    const users = getStoredUsers();
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error('Invalid username or password');
    }

    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return user;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();

      return profile || null;
    }

    // Local fallback
    const stored = localStorage.getItem(LOCAL_AUTH_KEY);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
  },

  async deleteAccount(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
    }
    const users = getStoredUsers().filter((u) => u.id !== userId);
    saveStoredUsers(users);
    localStorage.removeItem(LOCAL_AUTH_KEY);
  },
};

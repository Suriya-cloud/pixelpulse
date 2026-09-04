export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_private?: boolean;
  created_at: string;
  updated_at?: string;
  is_following?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

import type { UserProfile } from './user';

export interface PostMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  aspect_ratio: number;
  order_index: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  user: UserProfile;
  is_liked?: boolean;
  replies?: Comment[];
}

export interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at?: string;
  user: UserProfile;
  media: PostMedia[];
  is_liked?: boolean;
  is_saved?: boolean;
  recent_comments?: Comment[];
}

import type { UserProfile } from './user';
import type { Post } from './post';

export type NotificationType = 'follow' | 'like' | 'comment' | 'reply';

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  post_id?: string | null;
  comment_id?: string | null;
  read: boolean;
  created_at: string;
  actor: UserProfile;
  post?: Post | null;
}

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { NotificationItem } from '../types/notification';

const LOCAL_NOTIFS_KEY = 'pixelpulse_notifications';

function getStoredNotifications(): NotificationItem[] {
  const stored = localStorage.getItem(LOCAL_NOTIFS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export const notificationService = {
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_id(*),
          post:posts(*)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return data || [];
    }

    const notifs = getStoredNotifications();
    return notifs
      .filter((n) => n.recipient_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async markAsRead(notificationId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      return;
    }

    const notifs = getStoredNotifications();
    const notif = notifs.find((n) => n.id === notificationId);
    if (notif) {
      notif.read = true;
      localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifs));
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('notifications').update({ read: true }).eq('recipient_id', userId);
      return;
    }

    const notifs = getStoredNotifications();
    notifs.forEach((n) => {
      if (n.recipient_id === userId) n.read = true;
    });
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifs));
  },

  createNotification(notifData: Partial<NotificationItem>): NotificationItem {
    const notifs = getStoredNotifications();
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipient_id: notifData.recipient_id!,
      actor_id: notifData.actor_id!,
      type: notifData.type!,
      post_id: notifData.post_id || null,
      comment_id: notifData.comment_id || null,
      read: false,
      created_at: new Date().toISOString(),
      actor: notifData.actor!,
      post: notifData.post || null,
    };

    notifs.push(newNotif);
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifs));
    return newNotif;
  },
};

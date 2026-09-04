import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, UserPlus, MessageCircle, CheckCheck } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Avatar } from '../components/common/Avatar';
import { formatTimeAgo } from '../utils/dateUtils';
import type { NotificationType } from '../types/notification';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-violet-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-4 h-4 text-sky-500" />;
    }
  };

  const getNotifText = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return 'started following you.';
      case 'like':
        return 'liked your post.';
      case 'comment':
        return 'commented on your post.';
      case 'reply':
        return 'replied to your comment.';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          <span>Notifications</span>
        </h2>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="text-center py-10 text-xs text-neutral-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 space-y-3">
          <Heart className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            No Notifications Yet
          </h3>
          <p className="text-xs text-neutral-500">
            When people follow, like your posts, or leave comments, you'll see them right here!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markAsRead(notif.id);
                if (notif.type === 'follow') {
                  navigate(`/profile/${notif.actor.username}`);
                }
              }}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors ${
                notif.read
                  ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                  : 'bg-violet-500/5 dark:bg-violet-500/10 border-violet-500/30'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative">
                  <Avatar src={notif.actor?.avatar_url} username={notif.actor?.username || 'user'} size="md" />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800">
                    {getNotifIcon(notif.type)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-900 dark:text-neutral-100 leading-normal">
                    <span className="font-bold mr-1">@{notif.actor?.username}</span>
                    {getNotifText(notif.type)}
                  </p>
                  <span className="text-[10px] font-semibold text-neutral-400 mt-0.5 block">
                    {formatTimeAgo(notif.created_at)}
                  </span>
                </div>
              </div>

              {!notif.read && (
                <div className="w-2.5 h-2.5 rounded-full bg-violet-600 ml-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, Heart, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Avatar } from '../common/Avatar';

interface BottomNavProps {
  onOpenCreateModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenCreateModal }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 px-2 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `p-2 rounded-2xl transition-colors ${
              isActive ? 'text-violet-600 dark:text-violet-400 font-bold scale-110' : 'text-neutral-500 dark:text-neutral-400'
            }`
          }
        >
          <Home className="w-6 h-6" />
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `p-2 rounded-2xl transition-colors ${
              isActive ? 'text-violet-600 dark:text-violet-400 font-bold scale-110' : 'text-neutral-500 dark:text-neutral-400'
            }`
          }
        >
          <Compass className="w-6 h-6" />
        </NavLink>

        <button
          onClick={onOpenCreateModal}
          className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 active:scale-95 transition-transform"
        >
          <PlusSquare className="w-6 h-6" />
        </button>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `p-2 rounded-2xl relative transition-colors ${
              isActive ? 'text-violet-600 dark:text-violet-400 font-bold scale-110' : 'text-neutral-500 dark:text-neutral-400'
            }`
          }
        >
          <Heart className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-neutral-950 animate-ping" />
          )}
        </NavLink>

        <NavLink
          to={user ? `/profile/${user.username}` : '/login'}
          className={({ isActive }) =>
            `p-1 rounded-full transition-all ${
              isActive ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950' : ''
            }`
          }
        >
          {user ? (
            <Avatar src={user.avatar_url} username={user.username} size="xs" />
          ) : (
            <User className="w-6 h-6 text-neutral-500" />
          )}
        </NavLink>
      </div>
    </div>
  );
};

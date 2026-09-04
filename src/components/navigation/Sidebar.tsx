import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  PlusSquare,
  Heart,
  Bookmark,
  User,
  LogOut,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  onOpenCreateModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateModal }) => {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Explore', icon: Compass, path: '/explore' },
    {
      label: 'Notifications',
      icon: Heart,
      path: '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Saved', icon: Bookmark, path: '/saved' },
    { label: 'Profile', icon: User, path: user ? `/profile/${user.username}` : '/login' },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 border-r border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-4 lg:p-6 select-none z-30">
      {/* Brand Header */}
      <div className="space-y-6">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group px-2 py-1"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 fill-white/20 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              PixelPulse
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
              Social Platform
            </p>
          </div>
        </div>

        {/* Create Post Main Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <PlusSquare className="w-5 h-5" />
          <span>New Post</span>
        </button>

        {/* Nav Links */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`
              }
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer User & Theme Controls */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
        {/* Theme Switcher Button */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-violet-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>{resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 uppercase tracking-wider font-bold">
            Toggle
          </span>
        </button>

        {/* User Card & Logout */}
        {user && (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/60">
            <div
              onClick={() => navigate(`/profile/${user.username}`)}
              className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
            >
              <Avatar src={user.avatar_url} username={user.username} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  @{user.username}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

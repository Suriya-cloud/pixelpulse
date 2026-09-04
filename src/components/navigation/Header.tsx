import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
          <Sparkles className="w-4 h-4 fill-white/20" />
        </div>
        <span className="text-lg font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
          PixelPulse
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/explore')}
          className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          title="Search Users & Explore"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          title="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-5 h-5 text-violet-400" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" />
          )}
        </button>
      </div>
    </header>
  );
};

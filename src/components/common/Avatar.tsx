import React from 'react';

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
  showRing?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-3xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  username,
  size = 'md',
  className = '',
  onClick,
  showRing = false,
}) => {
  const initials = (username || 'U').substring(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`relative inline-block flex-shrink-0 cursor-pointer ${
        showRing ? 'p-[2px] bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 rounded-full' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-200 select-none transition-transform hover:scale-[1.02] ${
          sizeClasses[size]
        } ${className}`}
      >
        {src ? (
          <img
            src={src}
            alt={`@${username}'s avatar`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image to fallback to initials
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center -z-0">
          {initials}
        </span>
      </div>
    </div>
  );
};

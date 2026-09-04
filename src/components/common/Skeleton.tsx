import React from 'react';

export const PostSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 mb-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-neutral-300 dark:bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="w-28 h-3.5 bg-neutral-300 dark:bg-neutral-800 rounded" />
          <div className="w-20 h-2.5 bg-neutral-200 dark:bg-neutral-800/60 rounded" />
        </div>
      </div>
      <div className="w-full aspect-square bg-neutral-300 dark:bg-neutral-800 rounded-xl mb-4" />
      <div className="space-y-2">
        <div className="w-full h-3 bg-neutral-300 dark:bg-neutral-800 rounded" />
        <div className="w-3/4 h-3 bg-neutral-300 dark:bg-neutral-800 rounded" />
      </div>
    </div>
  );
};

export const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 mb-6 animate-pulse">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-neutral-300 dark:bg-neutral-800" />
      <div className="flex-1 space-y-4 text-center md:text-left">
        <div className="w-40 h-6 bg-neutral-300 dark:bg-neutral-800 rounded mx-auto md:mx-0" />
        <div className="flex justify-center md:justify-start gap-6">
          <div className="w-16 h-8 bg-neutral-300 dark:bg-neutral-800 rounded" />
          <div className="w-16 h-8 bg-neutral-300 dark:bg-neutral-800 rounded" />
          <div className="w-16 h-8 bg-neutral-300 dark:bg-neutral-800 rounded" />
        </div>
        <div className="w-48 h-4 bg-neutral-200 dark:bg-neutral-800/60 rounded mx-auto md:mx-0" />
      </div>
    </div>
  );
};

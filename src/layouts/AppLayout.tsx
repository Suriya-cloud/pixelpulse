import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { BottomNav } from '../components/navigation/BottomNav';
import { Header } from '../components/navigation/Header';
import { PostCreationModal } from '../components/post/PostCreationModal';
import { useFeed } from '../hooks/useFeed';

export const AppLayout: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { addCreatedPost } = useFeed();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Mobile Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8 mb-16 md:mb-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Global Post Creation Modal */}
      <PostCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={(newPost) => {
          addCreatedPost(newPost);
        }}
      />
    </div>
  );
};

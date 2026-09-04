import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types/user';
import type { Post } from '../types/post';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileGrid } from '../components/profile/ProfileGrid';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { ProfileHeaderSkeleton } from '../components/common/Skeleton';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);

    try {
      const fetchedProfile = await userService.getProfileByUsername(username, user?.id);
      setProfile(fetchedProfile);

      if (fetchedProfile) {
        const userPosts = await postService.getUserPosts(fetchedProfile.id, user?.id || '');
        setPosts(userPosts);

        if (user && user.id === fetchedProfile.id) {
          const userSaved = await postService.getSavedPosts(user.id);
          setSavedPosts(userSaved);
        }
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [username, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: Math.max(0, p.likes_count + (p.is_liked ? -1 : 1)),
            }
          : p
      )
    );
    await postService.toggleLikePost(postId, user);
  };

  const handleSavePost = async (postId: string) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_saved: !p.is_saved } : p))
    );
    await postService.toggleSavePost(postId, user.id);
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await postService.deletePost(postId, user.id);
    if (profile) {
      profile.posts_count = Math.max(0, profile.posts_count - 1);
    }
  };

  if (loading) {
    return <ProfileHeaderSkeleton />;
  }

  if (!profile) {
    return (
      <div className="text-center py-20 space-y-3">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          User Not Found
        </h3>
        <p className="text-xs text-neutral-500">
          The profile @{username} doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ProfileHeader
        profile={profile}
        onOpenEditModal={() => setShowEditModal(true)}
        onProfileUpdate={loadProfile}
      />

      <ProfileGrid
        posts={posts}
        savedPosts={savedPosts}
        isOwnProfile={isOwnProfile}
        onLikePost={handleLikePost}
        onSavePost={handleSavePost}
        onDeletePost={handleDeletePost}
      />

      {isOwnProfile && user && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentUser={user}
          onUpdated={(updated) => {
            updateUser(updated);
            setProfile(updated);
          }}
        />
      )}
    </div>
  );
};

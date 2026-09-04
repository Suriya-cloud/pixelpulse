import React, { useState } from 'react';
import { Settings, UserPlus, UserCheck, Calendar } from 'lucide-react';
import type { UserProfile } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
import { followService } from '../../services/followService';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { formatNumber } from '../../utils/formatters';
import { formatJoinedDate } from '../../utils/dateUtils';
import { Modal } from '../common/Modal';

interface ProfileHeaderProps {
  profile: UserProfile;
  onOpenEditModal: () => void;
  onProfileUpdate: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onOpenEditModal,
  onProfileUpdate,
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean>(Boolean(profile.is_following));
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);
  const [listUsers, setListUsers] = useState<UserProfile[]>([]);
  const [listTitle, setListTitle] = useState<string>('');

  const isOwnProfile = user?.id === profile.id;

  const handleToggleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        await followService.unfollowUser(user.id, profile.id);
        setIsFollowing(false);
        profile.followers_count = Math.max(0, profile.followers_count - 1);
      } else {
        await followService.followUser(user.id, profile.id);
        setIsFollowing(true);
        profile.followers_count += 1;
      }
      onProfileUpdate();
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowersList = async () => {
    setListTitle('Followers');
    setShowFollowersModal(true);
    const data = await followService.getFollowers(profile.id);
    setListUsers(data);
  };

  const openFollowingList = async () => {
    setListTitle('Following');
    setShowFollowingModal(true);
    const data = await followService.getFollowing(profile.id);
    setListUsers(data);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-3xl p-6 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-10">
        {/* Avatar */}
        <Avatar
          src={profile.avatar_url}
          username={profile.username}
          size="2xl"
          showRing
        />

        {/* User Info Details */}
        <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              @{profile.username}
            </h2>

            {/* Action Buttons */}
            <div className="flex items-center justify-center md:justify-start gap-2">
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Settings className="w-4 h-4" />}
                  onClick={onOpenEditModal}
                >
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? 'secondary' : 'primary'}
                  size="sm"
                  isLoading={followLoading}
                  leftIcon={isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  onClick={handleToggleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center md:justify-start gap-8 py-2 border-y border-neutral-100 dark:border-neutral-800/60">
            <div className="text-center md:text-left">
              <span className="block text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                {formatNumber(profile.posts_count)}
              </span>
              <span className="text-xs font-semibold text-neutral-500">Posts</span>
            </div>

            <div
              onClick={openFollowersList}
              className="text-center md:text-left cursor-pointer hover:opacity-75 transition-opacity"
            >
              <span className="block text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                {formatNumber(profile.followers_count)}
              </span>
              <span className="text-xs font-semibold text-neutral-500">Followers</span>
            </div>

            <div
              onClick={openFollowingList}
              className="text-center md:text-left cursor-pointer hover:opacity-75 transition-opacity"
            >
              <span className="block text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                {formatNumber(profile.following_count)}
              </span>
              <span className="text-xs font-semibold text-neutral-500">Following</span>
            </div>
          </div>

          {/* Display Name & Bio */}
          <div className="space-y-1">
            {profile.display_name && (
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {profile.display_name}
              </h3>
            )}
            {profile.bio && (
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line max-w-lg">
                {profile.bio}
              </p>
            )}
            <p className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] font-semibold text-neutral-400 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {formatJoinedDate(profile.created_at)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Followers / Following List Dialog */}
      <Modal
        isOpen={showFollowersModal || showFollowingModal}
        onClose={() => {
          setShowFollowersModal(false);
          setShowFollowingModal(false);
        }}
        title={listTitle}
        maxWidth="sm"
      >
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {listUsers.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-6">No users found</p>
          ) : (
            listUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatar_url} username={u.username} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      @{u.username}
                    </p>
                    <p className="text-[11px] text-neutral-500">{u.display_name}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

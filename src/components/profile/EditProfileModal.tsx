import React, { useState, useRef } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Avatar } from '../common/Avatar';
import type { UserProfile } from '../../types/user';
import { userService } from '../../services/userService';
import { uploadImageToStorage } from '../../lib/storage';
import { validateUsernameFormat } from '../../utils/formatters';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdated: (user: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdated,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(currentUser.username);
  const [displayName, setDisplayName] = useState(currentUser.display_name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewAvatarFile(file);
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = validateUsernameFormat(username);
    if (!val.valid) {
      setError(val.message || 'Invalid username');
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (newAvatarFile) {
        finalAvatarUrl = await uploadImageToStorage(newAvatarFile, 'avatars', currentUser.id);
      }

      const updated = await userService.updateProfile(currentUser.id, {
        username: username.toLowerCase().trim(),
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: finalAvatarUrl || undefined,
      });

      onUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" maxWidth="md">
      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Change Avatar */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <Avatar src={avatarUrl} username={username} size="xl" />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6" />
            </div>
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
          >
            Change Profile Photo
          </button>
        </div>

        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
        />

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your full name or handle"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Bio (max 150 chars)
          </label>
          <textarea
            rows={3}
            maxLength={150}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the world about yourself..."
            className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-3 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <div className="text-right text-[10px] text-neutral-400">{bio.length}/150</div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

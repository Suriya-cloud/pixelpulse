import React, { useState, useRef } from 'react';
import { Upload, X, MapPin, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { uploadImageToStorage } from '../../lib/storage';
import { validateImageFile, compressImage } from '../../utils/imageCompression';
import type { Post } from '../../types/post';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

interface ImageFilePreview {
  file: File;
  previewUrl: string;
  aspectRatio: number;
}

export const PostCreationModal: React.FC<PostCreationModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'select' | 'adjust' | 'details'>('select');
  const [images, setImages] = useState<ImageFilePreview[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const resetModal = () => {
    setStep('select');
    setImages([]);
    setCurrentImageIndex(0);
    setCaption('');
    setLocation('');
    setError(null);
    setPublishing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      setError('You can upload a maximum of 5 images per post.');
      return;
    }

    setError(null);
    const newPreviews: ImageFilePreview[] = [];

    for (const file of files) {
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file uploaded');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newPreviews.push({
        file,
        previewUrl,
        aspectRatio: validation.aspectRatio || 1.0,
      });
    }

    setImages((prev) => [...prev, ...newPreviews]);
    setStep('adjust');
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (currentImageIndex >= images.length - 1) {
      setCurrentImageIndex(Math.max(0, images.length - 2));
    }
    if (images.length <= 1) {
      setStep('select');
    }
  };

  const handlePublish = async () => {
    if (!user || images.length === 0 || publishing) return;

    setPublishing(true);
    setError(null);

    try {
      const uploadedMedia: { url: string; aspectRatio: number }[] = [];

      for (const item of images) {
        // Compress image before upload
        const compressed = await compressImage(item.file, 1200, 1200, 0.85);
        const publicUrl = await uploadImageToStorage(compressed, 'posts', user.id);

        uploadedMedia.push({
          url: publicUrl,
          aspectRatio: item.aspectRatio,
        });
      }

      const createdPost = await postService.createPost(
        user,
        caption,
        uploadedMedia,
        location
      );

      onPostCreated(createdPost);
      handleClose();
    } catch (err: any) {
      console.error('Publish post error:', err);
      setError(err.message || 'Failed to publish post');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Post" maxWidth="xl">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* STEP 1: Select Images */}
        {step === 'select' && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl p-10 text-center hover:border-violet-500 transition-colors">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Drag & Drop or Select Photos
            </h4>
            <p className="text-xs text-neutral-500 mb-6">
              Supports JPG, PNG, WebP (Up to 5 images, max 10MB each)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} size="md">
              Select From Device
            </Button>
          </div>
        )}

        {/* STEP 2: Preview & Adjust */}
        {step === 'adjust' && images.length > 0 && (
          <div className="space-y-4">
            <div className="relative w-full aspect-square bg-neutral-950 rounded-2xl overflow-hidden group">
              <img
                src={images[currentImageIndex].previewUrl}
                alt="Selected preview"
                className="w-full h-full object-contain"
              />

              <button
                onClick={() => removeImage(currentImageIndex)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>

              {images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button
                      onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {currentImageIndex < images.length - 1 && (
                    <button
                      onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Thumbnails row & Add more button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer flex-shrink-0 ${
                      idx === currentImageIndex ? 'border-violet-500 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img.previewUrl} className="w-full h-full object-cover" alt="thumb" />
                  </div>
                ))}
              </div>

              {images.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Add More</span>
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetModal}>
                Cancel
              </Button>
              <Button onClick={() => setStep('details')}>Next</Button>
            </div>
          </div>
        )}

        {/* STEP 3: Details & Caption */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <img
                src={images[0].previewUrl}
                alt="Post main thumbnail"
                className="w-20 h-20 rounded-xl object-cover border border-neutral-200 dark:border-neutral-800"
              />
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Caption
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write a captivating caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={2200}
                    className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-3 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <div className="text-right text-[10px] text-neutral-400 mt-0.5">
                    {caption.length}/2200
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-violet-500" />
                    <span>Add Location</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full mt-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button variant="outline" onClick={() => setStep('adjust')}>
                Back
              </Button>
              <Button onClick={handlePublish} isLoading={publishing}>
                Publish Post
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

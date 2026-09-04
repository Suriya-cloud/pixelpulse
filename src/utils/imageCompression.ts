export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      resolve({
        valid: false,
        error: 'Invalid file format. Please upload JPG, PNG, or WebP images.',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      resolve({
        valid: false,
        error: 'File size exceeds 10MB limit.',
      });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.width;
      const height = img.height;
      const aspectRatio = Number((width / height).toFixed(2));

      resolve({
        valid: true,
        width,
        height,
        aspectRatio,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Failed to read image dimensions.',
      });
    };

    img.src = objectUrl;
  });
}

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image compression error'));
    };

    img.src = objectUrl;
  });
}

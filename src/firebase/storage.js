// ============================================
// FIREBASE STORAGE SERVICE - Photo Uploads
// ============================================
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

// Upload a photo and return the download URL
export const uploadPhoto = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL, path: snapshot.ref.fullPath };
  } catch (error) {
    console.error('Upload photo error:', error);
    return { success: false, error: error.message };
  }
};

// Upload job photo (before/after/issue)
export const uploadJobPhoto = async (file, jobId, type = 'issue') => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `jobs/${jobId}/${type}_${timestamp}.${extension}`;
  return uploadPhoto(file, path);
};

// Upload pivot photo
export const uploadPivotPhoto = async (file, pivotId) => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `pivots/${pivotId}/${timestamp}.${extension}`;
  return uploadPhoto(file, path);
};

// Delete a photo
export const deletePhoto = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Delete photo error:', error);
    return { success: false, error: error.message };
  }
};

// Compress image before upload (client-side)
export const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // Set a timeout to prevent hanging indefinitely (30 seconds)
    const timeout = setTimeout(() => {
      reject(new Error('Image compression timeout - using original file'));
    }, 30000);

    const reader = new FileReader();

    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to read image file'));
    };

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image - file may be corrupted'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            clearTimeout(timeout);
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              clearTimeout(timeout);
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create compressed image blob'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
};

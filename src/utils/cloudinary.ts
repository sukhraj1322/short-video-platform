// Cloudinary configuration
import { saveVideoBlob } from '@/utils/idb';
// To use real Cloudinary, replace these with your own credentials
// For demo mode, leave as is to use local storage
export const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME'; // Replace with your cloud name
export const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; // Replace with your unsigned upload preset
export const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

// Check if we're using demo mode (no real Cloudinary credentials)
const isDemoMode = CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME' || CLOUDINARY_UPLOAD_PRESET === 'YOUR_UPLOAD_PRESET';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  duration: number;
  width: number;
  height: number;
  bytes: number;
  thumbnail_url: string;
}

// Mock upload for demo mode (stores video as blob URL)
async function mockUpload(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve) => {
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (onProgress) onProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
            // Create temporary blob URL for metadata/thumbnail generation
            const videoUrl = URL.createObjectURL(file);
        
        // Get video metadata
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = videoUrl;
        
        video.onloadedmetadata = () => {
          // Generate a thumbnail by capturing first frame
          video.currentTime = 0.1;
        };

        video.onseeked = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);

          // Persist the video file blob in IndexedDB so it survives reloads
          const publicId = `local_${Date.now()}`;
          try {
            // saveVideoBlob is imported from the idb helper so blobs are stored persistently
            await saveVideoBlob(publicId, file);
          } catch (e) {
            console.warn('Failed to save video blob to IndexedDB', e);
          }

          // Use a stable custom scheme for demo-stored videos. Watch page will resolve this.
          const stableUrl = `local://${publicId}`;

          resolve({
            secure_url: stableUrl,
            public_id: publicId,
            format: file.type.split('/')[1] || 'mp4',
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            bytes: file.size,
            thumbnail_url: thumbnailUrl,
          });
        };
      }
    }, 100);
  });
}

export async function uploadVideoToCloudinary(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> {
  // Use mock upload in demo mode
  if (isDemoMode) {
    console.log('Using demo mode - storing video locally');
    return mockUpload(file, onProgress);
  }
  
  // Real Cloudinary upload
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'video');

    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          
          // Generate thumbnail URL
          const thumbnailUrl = response.secure_url.replace(
            '/upload/',
            '/upload/w_400,h_720,c_fill,f_jpg/'
          );

          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            format: response.format,
            duration: response.duration,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            thumbnail_url: thumbnailUrl,
          });
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${xhr.responseText}`));
        }
      } else {
        let errorMessage = 'Upload failed';
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorMessage = errorResponse.error?.message || errorMessage;
        } catch (e) {
          errorMessage = `Upload failed with status ${xhr.status}: ${xhr.responseText}`;
        }
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error: Failed to connect to Cloudinary. Please check your internet connection.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    xhr.open('POST', CLOUDINARY_API_URL);
    xhr.send(formData);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

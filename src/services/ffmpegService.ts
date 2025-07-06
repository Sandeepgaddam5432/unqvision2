// This file is no longer used as the FFmpeg processing is done on the server
// Keeping this as a placeholder with empty functions for backward compatibility

export const initializeFFmpeg = async (onProgress?: (message: string) => void): Promise<void> => {
  console.warn('FFmpeg initialization is now handled by the server');
  return;
};

export const concatenateVideosWithTransitions = async (
  videoBlobs: Blob[],
  onProgress?: (message: string) => void
): Promise<Blob> => {
  console.warn('Video concatenation is now handled by the server');
  throw new Error('This function is no longer implemented client-side');
};

export const mergeVideoWithAudio = async (
  videoBlob: Blob,
  audioBlob: Blob,
  onProgress?: (message: string) => void
): Promise<Blob> => {
  console.warn('Audio merging is now handled by the server');
  throw new Error('This function is no longer implemented client-side');
};

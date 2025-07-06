// This file is no longer used as the TTS processing is done on the server
// Keeping this as a placeholder for backward compatibility

import { retryWithDifferentKeys } from '@/utils/apiUtils';

export interface SpeechRequest {
  text: string;
  model: string;
  apiKeys: string;
}

export const generateSpeech = async (request: SpeechRequest): Promise<Blob> => {
  console.warn('Text-to-speech generation is now handled by the server');
  throw new Error('This function is no longer implemented client-side');
};

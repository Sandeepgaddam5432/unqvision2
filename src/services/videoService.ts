import { retryWithDifferentKeys } from '@/utils/apiUtils';
import { generateSpeech } from './ttsService';
import { initializeFFmpeg, concatenateVideosWithTransitions, mergeVideoWithAudio } from './ffmpegService';

export interface VideoGenerationConfig {
  projectTitle: string;
  mainPrompt: string;
  languages: string[];
  googleApiKeys: string;
  pexelsApiKeys: string;
  textModel: string;
  voiceModel: string;
  onLogUpdate: (message: string, type?: 'info' | 'success' | 'processing' | 'warning') => void;
}

export interface ScenePlan {
  scenes: Array<{
    description: string;
    searchKeywords: string;
    duration: number;
  }>;
  totalDuration: number;
}

// The API URL should be configurable for development vs production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const generateVideo = async (config: VideoGenerationConfig): Promise<string> => {
  const { onLogUpdate } = config;
  
  try {
    // Ensure we're running in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Video generation can only run in a browser environment');
    }

    onLogUpdate('✅ Sending request to server...', 'processing');
    
    // Validate inputs
    if (!config.projectTitle || !config.mainPrompt) {
      throw new Error('Project title and prompt are required');
    }
    if (!config.googleApiKeys || !config.pexelsApiKeys) {
      throw new Error('API keys are required');
    }
    if (config.languages.length === 0) {
      throw new Error('At least one language must be selected');
    }

    // Call the backend API to generate the video
    const response = await fetch(`${API_URL}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectTitle: config.projectTitle,
        mainPrompt: config.mainPrompt,
        languages: config.languages,
        googleApiKeys: config.googleApiKeys,
        pexelsApiKeys: config.pexelsApiKeys,
        textModel: config.textModel,
        voiceModel: config.voiceModel
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Server error during video generation');
    }

    // Display any progress updates received from the server
    if (result.progressUpdates && Array.isArray(result.progressUpdates)) {
      result.progressUpdates.forEach((update: any) => {
        onLogUpdate(update.message, update.type as any);
      });
    }

    // Construct the full video URL
    const videoUrl = `${API_URL}${result.videoUrl}`;
    onLogUpdate(`✅ Video processing completed!`, 'success');
    
    return videoUrl;
  } catch (error: any) {
    const errorMessage = error?.message || 'undefined';
    const userFriendlyMessage = errorMessage === 'undefined' 
      ? 'Video generation failed. The server might be experiencing issues or resource limitations.'
      : `${error.message}`;
    
    onLogUpdate(`❌ Error: ${userFriendlyMessage}`, 'warning');
    
    // Re-throw with improved message
    const enhancedError = new Error(userFriendlyMessage);
    throw enhancedError;
  }
};

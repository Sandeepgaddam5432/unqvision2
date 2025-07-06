// This file is now just a placeholder since video generation is handled by the Colab server
// and directly called from Index.tsx

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
// Removed the default value to ensure we're explicitly using the environment variable
const API_URL = import.meta.env.VITE_API_URL;

// This function is no longer used as the video generation API is called directly from Index.tsx
// Kept for backward compatibility or if we need to revert to the old approach
export const generateVideo = async (config: VideoGenerationConfig): Promise<string> => {
  const { onLogUpdate } = config;
  
  try {
    // Ensure we're running in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Video generation can only run in a browser environment');
    }

    onLogUpdate('⚠️ This function is deprecated. Video generation is now handled directly by Index.tsx', 'warning');
    
    // Check if API URL is configured
    if (!API_URL) {
      onLogUpdate('❌ Error: VITE_API_URL is not set in the frontend environment.', 'warning');
      throw new Error('Frontend API URL is not configured.');
    }
    
    // This is a fallback implementation, not actually used in the current version
    onLogUpdate('✅ Sending request to Colab server...', 'processing');
    
    throw new Error('This function is deprecated. Video generation is now handled directly in the Index component.');
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

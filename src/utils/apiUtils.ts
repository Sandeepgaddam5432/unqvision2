
// Utility functions for API key management and model fetching
export const getRandomKey = (keysString: string): string => {
  if (!keysString) throw new Error('No API keys provided');
  const keys = keysString.split(',').map(key => key.trim()).filter(key => key);
  if (keys.length === 0) throw new Error('No valid API keys found');
  return keys[Math.floor(Math.random() * keys.length)];
};

export const getAllKeys = (keysString: string): string[] => {
  if (!keysString) return [];
  return keysString.split(',').map(key => key.trim()).filter(key => key);
};

export const retryWithDifferentKeys = async <T>(
  operation: (apiKey: string) => Promise<T>,
  keysString: string,
  operationName: string = 'API call'
): Promise<T> => {
  const keys = getAllKeys(keysString);
  
  if (keys.length === 0) {
    throw new Error('No API keys provided');
  }

  let lastError: Error | null = null;
  
  for (const key of keys) {
    try {
      console.log(`Attempting ${operationName} with key: ${key.slice(0, 10)}...`);
      return await operation(key);
    } catch (error: any) {
      lastError = error;
      console.log(`${operationName} failed with key ${key.slice(0, 10)}...:`, error.message);
      
      // Check if it's a quota/rate limit error
      if (error.message?.includes('quota') || 
          error.message?.includes('rate limit') || 
          error.message?.includes('QUOTA_EXCEEDED') ||
          error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        continue; // Try next key
      } else {
        // If it's not a quota error, don't retry with other keys
        throw error;
      }
    }
  }
  
  // All keys failed
  throw new Error(`❌ All provided API keys have exceeded their quota for ${operationName}. Please add a new key.`);
};

export const fetchAvailableModels = async (apiKey: string) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch models');
    }

    const textModels = data.models
      ?.filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
      ?.map((model: any) => model.name.replace('models/', '')) || [];

    // Include latest TTS models including preview models
    const voiceModels = [
      'tts-1', 
      'tts-1-hd',
      'gemini-2.5-flash-preview-tts',
      'gemini-2.5-pro-preview-tts'
    ];

    return { textModels, voiceModels };
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
};

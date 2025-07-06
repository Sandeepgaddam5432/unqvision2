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

export const generateAIDirectorPlan = async (prompt: string, apiKeys: string): Promise<ScenePlan> => {
  const directorPrompt = `As an AI Director, create a detailed scene-by-scene plan for a video about: "${prompt}"

Return ONLY a JSON object with this exact structure:
{
  "scenes": [
    {
      "description": "A detailed description of what happens in this scene",
      "searchKeywords": "keywords for finding stock footage",
      "duration": 5
    }
  ],
  "totalDuration": 30
}

Create 6 scenes, each 5 seconds long. Focus on visual, cinematic storytelling.`;

  const aiDirectorOperation = async (apiKey: string) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: directorPrompt }]
        }]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to generate plan');
    }

    const planText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!planText) throw new Error('No plan generated');

    // Extract JSON from the response
    const jsonMatch = planText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid plan format');

    return JSON.parse(jsonMatch[0]);
  };

  return await retryWithDifferentKeys(aiDirectorOperation, apiKeys, 'AI Director plan generation');
};

export const translateScript = async (script: string, language: string, apiKeys: string): Promise<string> => {
  const translatePrompt = `Translate the following script to ${language}. Return ONLY the translated text, nothing else:

${script}`;

  const translateOperation = async (apiKey: string) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: translatePrompt }]
        }]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Translation failed');
    }

    return result.candidates?.[0]?.content?.parts?.[0]?.text || script;
  };

  try {
    return await retryWithDifferentKeys(translateOperation, apiKeys, 'Script translation');
  } catch (error) {
    console.error('Translation Error:', error);
    return script; // Fallback to original text
  }
};

export const fetchPexelsVideo = async (keywords: string, apiKeys: string): Promise<Blob> => {
  const pexelsOperation = async (apiKey: string) => {
    const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(keywords)}&per_page=1`, {
      headers: {
        'Authorization': apiKey
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to fetch video from Pexels');
    }

    const videoUrl = result.videos?.[0]?.video_files?.[0]?.link;
    if (!videoUrl) throw new Error('No video found');

    const videoResponse = await fetch(videoUrl);
    return await videoResponse.blob();
  };

  return await retryWithDifferentKeys(pexelsOperation, apiKeys, 'Pexels video fetch');
};

export const generateVideo = async (config: VideoGenerationConfig): Promise<string> => {
  const { onLogUpdate } = config;
  
  try {
    // Ensure we're running in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Video generation can only run in a browser environment');
    }

    onLogUpdate('✅ Validating inputs...', 'success');
    
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

    onLogUpdate('🎬 Initializing video processing engine...', 'processing');
    await initializeFFmpeg((message) => onLogUpdate(message, 'processing'));

    onLogUpdate('🧠 Generating cinematic script with Gemini...', 'processing');
    
    // Generate scene plan
    const scenePlan = await generateAIDirectorPlan(config.mainPrompt, config.googleApiKeys);
    
    // Create script from scenes
    const script = scenePlan.scenes.map(scene => scene.description).join(' ');
    
    // For now, process the first language only
    const language = config.languages[0];
    
    onLogUpdate(`🌐 Translating script to ${language}...`, 'processing');
    const translatedScript = await translateScript(script, language, config.googleApiKeys);
    
    onLogUpdate(`🎤 Generating voiceover for ${language}...`, 'processing');
    const audioBlob = await generateSpeech({
      text: translatedScript,
      model: config.voiceModel,
      apiKeys: config.googleApiKeys
    });
    
    onLogUpdate('🎬 Fetching video footage from Pexels...', 'processing');
    
    // Fetch videos for each scene
    const videoBlobs: Blob[] = [];
    for (let i = 0; i < scenePlan.scenes.length; i++) {
      const scene = scenePlan.scenes[i];
      onLogUpdate(`🎬 Fetching video ${i + 1}/${scenePlan.scenes.length}: ${scene.searchKeywords}`, 'processing');
      
      try {
        const videoBlob = await fetchPexelsVideo(scene.searchKeywords, config.pexelsApiKeys);
        videoBlobs.push(videoBlob);
      } catch (error) {
        // Fallback to main prompt keywords if scene-specific search fails
        onLogUpdate(`⚠️ Scene-specific video not found, using main prompt...`, 'warning');
        const fallbackBlob = await fetchPexelsVideo(config.mainPrompt, config.pexelsApiKeys);
        videoBlobs.push(fallbackBlob);
      }
    }
    
    onLogUpdate('✂️ Stitching videos with cinematic transitions...', 'processing');
    const silentVideo = await concatenateVideosWithTransitions(
      videoBlobs, 
      (message) => onLogUpdate(message, 'processing')
    );
    
    onLogUpdate('🎵 Merging video with voiceover...', 'processing');
    const finalVideo = await mergeVideoWithAudio(
      silentVideo, 
      audioBlob, 
      (message) => onLogUpdate(message, 'processing')
    );
    
    // Create blob URL for the final video
    const videoUrl = URL.createObjectURL(finalVideo);
    
    onLogUpdate(`✅ Video for ${language} is ready!`, 'success');
    
    return videoUrl;
  } catch (error) {
    const errorMessage = error?.message || 'undefined';
    const userFriendlyMessage = errorMessage === 'undefined' 
      ? 'Video generation failed. This might be due to resource limitations in the deployment environment. Please try again or run the project on a more powerful machine.'
      : `${error.message}`;
    
    onLogUpdate(`❌ Error: ${userFriendlyMessage}`, 'warning');
    
    // Re-throw with improved message
    const enhancedError = new Error(userFriendlyMessage);
    throw enhancedError;
  }
};

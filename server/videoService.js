const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { generateSpeech } = require('./ttsService');

// Interface definitions (as comments for Node.js)
/*
interface VideoGenerationConfig {
  projectTitle: string;
  mainPrompt: string;
  languages: string[];
  googleApiKeys: string;
  pexelsApiKeys: string;
  textModel: string;
  voiceModel: string;
  tempDir: string;
  onLogUpdate: (message: string, type?: 'info' | 'success' | 'processing' | 'warning') => void;
}

interface ScenePlan {
  scenes: Array<{
    description: string;
    searchKeywords: string;
    duration: number;
  }>;
  totalDuration: number;
}
*/

// Helper function to retry operations with different API keys
const retryWithDifferentKeys = async (operation, apiKeysStr, operationName) => {
  const apiKeys = apiKeysStr.split(',').map(key => key.trim()).filter(Boolean);
  
  if (apiKeys.length === 0) {
    throw new Error(`No valid API keys provided for ${operationName}`);
  }
  
  let lastError = null;
  
  for (const apiKey of apiKeys) {
    try {
      return await operation(apiKey);
    } catch (error) {
      lastError = error;
      console.warn(`Failed with API key (${apiKey.substring(0, 4)}...): ${error.message}`);
    }
  }
  
  throw new Error(`All API keys failed for ${operationName}: ${lastError.message}`);
};

const generateAIDirectorPlan = async (prompt, apiKeys) => {
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

  const aiDirectorOperation = async (apiKey) => {
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

const translateScript = async (script, language, apiKeys) => {
  const translatePrompt = `Translate the following script to ${language}. Return ONLY the translated text, nothing else:

${script}`;

  const translateOperation = async (apiKey) => {
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

const fetchPexelsVideo = async (keywords, apiKeys) => {
  const pexelsOperation = async (apiKey) => {
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

    // Download the video file to the temp directory
    const videoResponse = await fetch(videoUrl);
    const buffer = await videoResponse.buffer();
    const tempFilePath = path.join(tempDir, `pexels_${Date.now()}.mp4`);
    await fs.writeFile(tempFilePath, buffer);
    return tempFilePath;
  };

  return await retryWithDifferentKeys(pexelsOperation, apiKeys, 'Pexels video fetch');
};

// Server-side implementation of video generation
const generateVideo = async (config) => {
  const { onLogUpdate, tempDir } = config;
  
  try {
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

    onLogUpdate('🎬 Initializing video processing...', 'processing');
    
    // Generate scene plan
    onLogUpdate('🧠 Generating cinematic script with Gemini...', 'processing');
    const scenePlan = await generateAIDirectorPlan(config.mainPrompt, config.googleApiKeys);
    
    // Create script from scenes
    const script = scenePlan.scenes.map(scene => scene.description).join(' ');
    
    // For now, process the first language only
    const language = config.languages[0];
    
    onLogUpdate(`🌐 Translating script to ${language}...`, 'processing');
    const translatedScript = await translateScript(script, language, config.googleApiKeys);
    
    onLogUpdate(`🎤 Generating voiceover for ${language}...`, 'processing');
    const audioFilePath = await generateSpeech({
      text: translatedScript,
      model: config.voiceModel,
      apiKeys: config.googleApiKeys,
      tempDir
    });
    
    onLogUpdate('🎬 Fetching video footage from Pexels...', 'processing');
    
    // Fetch videos for each scene
    const videoFilePaths = [];
    for (let i = 0; i < scenePlan.scenes.length; i++) {
      const scene = scenePlan.scenes[i];
      onLogUpdate(`🎬 Fetching video ${i + 1}/${scenePlan.scenes.length}: ${scene.searchKeywords}`, 'processing');
      
      try {
        const videoFilePath = await fetchPexelsVideo(scene.searchKeywords, config.pexelsApiKeys, tempDir);
        videoFilePaths.push(videoFilePath);
      } catch (error) {
        // Fallback to main prompt keywords if scene-specific search fails
        onLogUpdate(`⚠️ Scene-specific video not found, using main prompt...`, 'warning');
        const fallbackFilePath = await fetchPexelsVideo(config.mainPrompt, config.pexelsApiKeys, tempDir);
        videoFilePaths.push(fallbackFilePath);
      }
    }
    
    onLogUpdate('✂️ Stitching videos with cinematic transitions...', 'processing');
    const silentVideoPath = await concatenateVideosWithTransitions(videoFilePaths, tempDir, onLogUpdate);
    
    onLogUpdate('🎵 Merging video with voiceover...', 'processing');
    const finalVideoPath = await mergeVideoWithAudio(silentVideoPath, audioFilePath, tempDir, onLogUpdate);
    
    onLogUpdate(`✅ Video for ${language} is ready!`, 'success');
    
    return finalVideoPath;
  } catch (error) {
    const errorMessage = error?.message || 'undefined';
    const userFriendlyMessage = errorMessage === 'undefined' 
      ? 'Video generation failed due to an unknown error'
      : `${error.message}`;
    
    onLogUpdate(`❌ Error: ${userFriendlyMessage}`, 'warning');
    throw new Error(userFriendlyMessage);
  }
};

// Server-side implementation using fluent-ffmpeg
const concatenateVideosWithTransitions = async (videoFilePaths, tempDir, onProgress) => {
  if (videoFilePaths.length === 0) {
    throw new Error('No video files provided');
  }
  
  onProgress('Preparing video clips...');
  
  // If only one video, just return it
  if (videoFilePaths.length === 1) {
    return videoFilePaths[0];
  }
  
  // Create a list file for concatenation
  const concatListPath = path.join(tempDir, 'concat_list.txt');
  const concatListContent = videoFilePaths.map(filepath => `file '${filepath}'`).join('\n');
  await fs.writeFile(concatListPath, concatListContent);
  
  // Output path for concatenated video
  const outputPath = path.join(tempDir, `concatenated_${Date.now()}.mp4`);
  
  // Use ffmpeg to concatenate videos
  return new Promise((resolve, reject) => {
    onProgress('Stitching videos with cinematic transitions...');
    
    let command = ffmpeg();
    
    // Add inputs with crossfade filters
    if (videoFilePaths.length >= 2) {
      videoFilePaths.forEach(file => {
        command = command.input(file);
      });
      
      // Create filter complex for crossfade transitions
      let filterComplex = '';
      let currentLabel = '0:v';
      
      for (let i = 1; i < videoFilePaths.length; i++) {
        const nextLabel = `v${i}`;
        filterComplex += `[${currentLabel}][${i}:v]xfade=transition=fade:duration=0.5:offset=${(i-1)*5 + 4.5}[${nextLabel}];`;
        currentLabel = nextLabel;
      }
      
      // Remove the trailing semicolon
      filterComplex = filterComplex.slice(0, -1);
      
      command
        .complexFilter(filterComplex)
        .map(`[v${videoFilePaths.length-1}]`)
        .videoCodec('libx264')
        .outputOptions(['-preset fast', '-crf 23'])
        .save(outputPath)
        .on('progress', progress => {
          onProgress(`Processing: ${Math.floor(progress.percent || 0)}% complete`);
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', err => {
          console.error('FFmpeg error:', err);
          reject(new Error(`FFmpeg processing failed: ${err.message}`));
        });
    } else {
      // Simple copy for a single file
      command
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions('-c copy')
        .save(outputPath)
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', err => {
          console.error('FFmpeg error:', err);
          reject(new Error(`FFmpeg processing failed: ${err.message}`));
        });
    }
  });
};

// Server-side implementation of audio merging
const mergeVideoWithAudio = async (videoFilePath, audioFilePath, tempDir, onProgress) => {
  onProgress('Merging video with voiceover...');
  
  const outputPath = path.join(tempDir, `final_${Date.now()}.mp4`);
  
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoFilePath)
      .input(audioFilePath)
      .outputOptions([
        '-c:v copy',        // Don't re-encode video
        '-c:a aac',         // Use AAC for audio
        '-shortest'         // Match the shortest stream duration
      ])
      .save(outputPath)
      .on('progress', progress => {
        onProgress(`Finalizing: ${Math.floor(progress.percent || 0)}% complete`);
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', err => {
        console.error('FFmpeg error:', err);
        reject(new Error(`FFmpeg merging failed: ${err.message}`));
      });
  });
};

module.exports = {
  generateVideo,
  generateAIDirectorPlan,
  translateScript,
  fetchPexelsVideo,
  concatenateVideosWithTransitions,
  mergeVideoWithAudio
}; 
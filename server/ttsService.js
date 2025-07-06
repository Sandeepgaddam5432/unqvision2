const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');

// Interface definitions (as comments for Node.js)
/*
interface SpeechRequest {
  text: string;
  model: string;
  apiKeys: string;
  tempDir: string;
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

const generateSpeech = async ({ text, model, apiKeys, tempDir }) => {
  const ttsOperation = async (apiKey) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text }]
        }],
        generationConfig: {
          temperature: 0.8
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'TTS generation failed');
    }

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error('No audio content generated');
    }

    // Extract the audio data from the response
    const audioPart = data.candidates[0].content.parts.find(part => part.audio_data);
    if (!audioPart) {
      throw new Error('No audio data in response');
    }

    // Decode base64 audio data
    const audioBuffer = Buffer.from(audioPart.audio_data, 'base64');
    
    // Save to temporary file
    const audioFilePath = path.join(tempDir, `tts_${Date.now()}.mp3`);
    await fs.writeFile(audioFilePath, audioBuffer);
    
    return audioFilePath;
  };

  return await retryWithDifferentKeys(ttsOperation, apiKeys, 'Text-to-speech generation');
};

module.exports = {
  generateSpeech
}; 
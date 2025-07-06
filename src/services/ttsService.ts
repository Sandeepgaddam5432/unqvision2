
import { retryWithDifferentKeys } from '@/utils/apiUtils';

export interface TTSConfig {
  text: string;
  model: string;
  apiKeys: string;
}

export const generateSpeech = async ({ text, model, apiKeys }: TTSConfig): Promise<Blob> => {
  const ttsOperation = async (apiKey: string) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/text-to-speech:generateSpeech?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${model}`,
        text_input: text,
        voice_config: {},
        audio_config: {
          audio_encoding: "MP3"
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'TTS generation failed');
    }

    if (result.audioContent) {
      // Convert base64 to blob
      const audioBlob = await (await fetch(`data:audio/mp3;base64,${result.audioContent}`)).blob();
      return audioBlob;
    }
    
    throw new Error('No audio content received');
  };

  return await retryWithDifferentKeys(ttsOperation, apiKeys, 'TTS generation');
};

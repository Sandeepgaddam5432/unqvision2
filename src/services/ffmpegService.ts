import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const initializeFFmpeg = async (onProgress?: (message: string) => void): Promise<void> => {
  if (ffmpeg) return;
  
  // Ensure we're running in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('FFmpeg initialization can only run in a browser environment');
  }
  
  try {
    ffmpeg = new FFmpeg();
    
    if (onProgress) {
      ffmpeg.on('log', ({ message }) => {
        onProgress(`FFmpeg: ${message}`);
      });
    }
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  } catch (error) {
    // Create more specific error for memory/resource issues
    const errorMessage = error?.message || 'undefined';
    if (errorMessage.includes('memory') || errorMessage === 'undefined') {
      throw new Error('FFmpeg initialization failed due to memory or resource constraints. Try running on a device with more resources.');
    }
    throw error;
  }
};

export const concatenateVideosWithTransitions = async (
  videoBlobs: Blob[],
  onProgress?: (message: string) => void
): Promise<Blob> => {
  if (!ffmpeg) throw new Error('FFmpeg not initialized');
  
  if (videoBlobs.length === 0) throw new Error('No video blobs provided');
  
  // Check total video size to warn about potential resource issues
  const totalSize = videoBlobs.reduce((size, blob) => size + blob.size, 0);
  const totalMB = totalSize / (1024 * 1024);
  
  if (totalMB > 100) {
    onProgress?.(`⚠️ Warning: Processing ${totalMB.toFixed(1)}MB of video data may exceed browser limitations`);
  }
  
  try {
    onProgress?.('Preparing video clips...');
    
    // Write all video files to ffmpeg
    const inputFiles: string[] = [];
    for (let i = 0; i < videoBlobs.length; i++) {
      const filename = `input${i}.mp4`;
      await ffmpeg.writeFile(filename, await fetchFile(videoBlobs[i]));
      inputFiles.push(filename);
    }
    
    if (videoBlobs.length === 1) {
      // Single video, no concatenation needed
      onProgress?.('Processing single video clip...');
      await ffmpeg.exec(['-i', inputFiles[0], '-c', 'copy', 'output.mp4']);
    } else {
      // Multiple videos, concatenate with crossfade transitions
      onProgress?.('Stitching videos with cinematic transitions...');
      
      // Create filter complex for crossfade transitions
      let filterComplex = '';
      let currentLabel = '0:v';
      
      for (let i = 1; i < inputFiles.length; i++) {
        const nextLabel = `v${i}`;
        filterComplex += `[${currentLabel}][${i}:v]xfade=transition=fade:duration=0.5:offset=${(i-1)*5 + 4.5}[${nextLabel}];`;
        currentLabel = nextLabel;
      }
      
      // Remove the trailing semicolon
      filterComplex = filterComplex.slice(0, -1);
      
      const args = [
        ...inputFiles.flatMap(file => ['-i', file]),
        '-filter_complex', filterComplex,
        '-map', `[v${inputFiles.length-1}]`,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        'output.mp4'
      ];
      
      await ffmpeg.exec(args);
    }
    
    onProgress?.('Reading processed video...');
    const data = await ffmpeg.readFile('output.mp4');
    
    // Cleanup
    for (const file of inputFiles) {
      await ffmpeg.deleteFile(file);
    }
    await ffmpeg.deleteFile('output.mp4');
    
    return new Blob([data], { type: 'video/mp4' });
  } catch (error) {
    // Enhance error message with resource information
    const errorMessage = error?.message || 'undefined';
    if (errorMessage === 'undefined') {
      throw new Error('Video processing failed due to memory or resource constraints. Try reducing video quality or processing fewer videos.');
    }
    throw error;
  }
};

export const mergeVideoWithAudio = async (
  videoBlob: Blob,
  audioBlob: Blob,
  onProgress?: (message: string) => void
): Promise<Blob> => {
  if (!ffmpeg) throw new Error('FFmpeg not initialized');
  
  try {
    onProgress?.('Merging video with voiceover...');
    
    // Write video and audio files
    await ffmpeg.writeFile('video.mp4', await fetchFile(videoBlob));
    await ffmpeg.writeFile('audio.mp3', await fetchFile(audioBlob));
    
    // Merge video and audio
    await ffmpeg.exec([
      '-i', 'video.mp4',
      '-i', 'audio.mp3',
      '-c:v', 'copy', // Don't re-encode video for speed
      '-c:a', 'aac',
      '-shortest', // Match shortest stream duration
      'final.mp4'
    ]);
    
    onProgress?.('Finalizing video...');
    const data = await ffmpeg.readFile('final.mp4');
    
    // Cleanup
    await ffmpeg.deleteFile('video.mp4');
    await ffmpeg.deleteFile('audio.mp3');
    await ffmpeg.deleteFile('final.mp4');
    
    return new Blob([data], { type: 'video/mp4' });
  } catch (error) {
    // Enhance error message with resource information
    const errorMessage = error?.message || 'undefined';
    if (errorMessage === 'undefined') {
      throw new Error('Final video rendering failed due to memory or resource constraints. Try with a shorter video or on a device with more resources.');
    }
    throw error;
  }
};

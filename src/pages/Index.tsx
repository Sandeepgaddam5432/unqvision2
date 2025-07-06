import React, { useState } from 'react';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import { StatusPanel, LogEntry } from '@/components/StatusPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { generateVideo } from '@/services/videoService';
import { toast } from 'sonner';

const Index = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      message: "Waiting for instructions...",
      timestamp: new Date().toLocaleTimeString(),
      type: 'info'
    }
  ]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleGenerate = async (config: {
    projectTitle: string;
    mainPrompt: string;
    languages: string[];
    googleApiKeys: string;
    pexelsApiKeys: string;
    textModel: string;
    voiceModel: string;
  }) => {
    setIsGenerating(true);
    setIsVideoReady(false);
    setVideoUrl(null);
    
    // Clear previous logs
    setLogs([]);
    
    // Add initial log
    addLog("🚀 Starting video generation on server...", 'info');

    try {
      // The video generation is now done on the server
      const videoUrl = await generateVideo({
        ...config,
        onLogUpdate: addLog
      });
      
      setVideoUrl(videoUrl);
      setIsVideoReady(true);
      toast.success('Video generation completed!');
      addLog("✅ Video generation complete! Ready to play and download.", 'success');
    } catch (error) {
      console.error('Generation failed:', error);
      
      // Improved error message handling
      const errorMessage = error?.message || 'Video generation failed due to unknown reasons';
      toast.error(`Generation failed: ${errorMessage}`);
      
      // Add a special log entry for server errors
      addLog(
        "Video generation failed. The server might be experiencing issues. Please try again later.",
        'warning'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      // For server-generated videos, we directly use the URL as is
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = 'unqvision-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <h1 className="text-2xl font-bold text-white">UnQVision</h1>
              <span className="text-sm text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
                AI Video Generator
              </span>
            </div>
            
            {/* Server status indicator */}
            <div className="text-sm text-gray-300">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Server-powered
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Column 1: Configuration Panel */}
          <div className="lg:col-span-1">
            <ConfigurationPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
          </div>

          {/* Column 2: Status Panel */}
          <div className="lg:col-span-1">
            <StatusPanel logs={logs} />
          </div>

          {/* Column 3: Preview Panel */}
          <div className="lg:col-span-1">
            <PreviewPanel 
              videoUrl={videoUrl}
              isVideoReady={isVideoReady}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

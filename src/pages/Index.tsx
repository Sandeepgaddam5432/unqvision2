import React, { useState, useEffect } from 'react';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import { StatusPanel, LogEntry } from '@/components/StatusPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { generateVideo } from '@/services/videoService';
import { toast } from 'sonner';

// API URL from environment variables - remove default value to ensure explicit env var usage
const API_URL = import.meta.env.VITE_API_URL;

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  // Set up status polling when session ID changes
  useEffect(() => {
    if (sessionId && isGenerating) {
      // Start polling for status updates
      const intervalId = window.setInterval(() => {
        pollGenerationStatus(sessionId);
      }, 2000);
      
      setPollingInterval(intervalId);
      
      // Cleanup interval on component unmount or when session ends
      return () => {
        if (intervalId) {
          window.clearInterval(intervalId);
        }
      };
    } else if (!isGenerating && pollingInterval) {
      // Clear polling when generation ends
      window.clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [sessionId, isGenerating]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Poll the server for generation status updates
  const pollGenerationStatus = async (sid: string) => {
    try {
      // Verify API URL is set
      if (!API_URL) {
        console.error('Error: VITE_API_URL is not set in the frontend environment.');
        addLog('❌ Error: API URL is not configured properly.', 'warning');
        return;
      }

      const response = await fetch(`${API_URL}/generation-status/${sid}`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Status polling error:', data.error);
        return;
      }
      
      // Update logs with new progress updates
      if (data.progressUpdates && Array.isArray(data.progressUpdates)) {
        // Only add logs that we don't already have
        const existingLogIds = new Set(logs.map(log => log.id));
        const newLogs = data.progressUpdates.filter(
          (update: LogEntry) => !existingLogIds.has(update.id)
        );
        
        if (newLogs.length > 0) {
          setLogs(prev => [...prev, ...newLogs]);
        }
      }
      
      // Check if generation is complete
      if (data.isComplete && data.videoUrl) {
        setVideoUrl(`${API_URL}${data.videoUrl}`);
        setIsVideoReady(true);
        setIsGenerating(false);
        setSessionId(null);
        toast.success('Video generation completed!');
      }
      
      // Check for errors
      if (data.isError) {
        setIsGenerating(false);
        setSessionId(null);
        toast.error('Video generation failed. Check the logs for details.');
      }
    } catch (error) {
      console.error('Error polling generation status:', error);
    }
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
    addLog("🚀 Starting video generation on Colab server...", 'info');

    try {
      // Verify API URL is set
      if (!API_URL) {
        console.error('Error: VITE_API_URL is not set in the frontend environment.');
        addLog('❌ Error: API URL is not configured properly.', 'warning');
        setIsGenerating(false);
        return;
      }

      // Start the video generation on the server
      const response = await fetch(`${API_URL}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start video generation');
      }
      
      // Save the session ID for polling
      setSessionId(data.sessionId);
      
      addLog(`✅ Video generation started on server (Session ID: ${data.sessionId.substring(0, 8)}...)`, 'success');
    } catch (error) {
      // Log the full error object for debugging
      console.error('Full error object:', error);
      
      // Improved error message handling
      const errorMessage = error instanceof Error ? error.message : 'Video generation failed due to unknown reasons';
      toast.error(`Generation failed: ${errorMessage}`);
      
      addLog(
        "Video generation failed. The server might be experiencing issues. Please try again later.",
        'warning'
      );
      
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
              Colab-powered
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

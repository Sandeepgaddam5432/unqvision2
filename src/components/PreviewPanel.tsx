
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Download, Video } from 'lucide-react';

interface PreviewPanelProps {
  videoUrl: string | null;
  isVideoReady: boolean;
  onDownload: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  videoUrl,
  isVideoReady,
  onDownload
}) => {
  return (
    <Card className="h-full bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Video className="w-5 h-5 text-purple-400" />
          Preview & Download
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)] flex flex-col">
        {/* Video Preview Area */}
        <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-600 mb-4">
          {isVideoReady && videoUrl ? (
            <div className="w-full h-full flex flex-col">
              <video
                src={videoUrl}
                controls
                className="w-full h-full rounded-lg bg-black"
                poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMUUyOTNiIi8+CjxwYXRoIGQ9Ik0xNDQuNSA5MEwxNzAuNSAxMDcuNVYzMi41TDE0NC41IDkwWiIgZmlsbD0iIzMzOUFGNCIvPgo8L3N2Zz4K"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg mb-2">Your video will appear here</p>
              <p className="text-slate-500 text-sm">
                Click "Generate Video" to start creating your content
              </p>
            </div>
          )}
        </div>

        {/* Download Section */}
        <div className="space-y-3">
          {isVideoReady && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <span className="text-lg">✅</span>
                Video generation complete!
              </div>
            </div>
          )}
          
          <Button
            onClick={onDownload}
            disabled={!isVideoReady}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition-all duration-200"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Video
          </Button>
          
          {!isVideoReady && (
            <p className="text-xs text-slate-500 text-center">
              Download will be available after video generation
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

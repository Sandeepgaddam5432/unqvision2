
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock } from 'lucide-react';

export interface LogEntry {
  id: number;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'processing' | 'warning';
}

interface StatusPanelProps {
  logs: LogEntry[];
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ logs = [] }) => {
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'processing':
        return '🔄';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'processing':
        return 'text-blue-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <Card className="h-full bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-green-400" />
          Status & Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-80px)]">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:bg-slate-700/50 transition-colors duration-200"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-lg">{getLogIcon(log.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${getLogColor(log.type)} leading-relaxed`}>
                    {log.message}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {log.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

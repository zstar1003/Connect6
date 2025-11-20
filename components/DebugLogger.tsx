import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'error' | 'success';
  timestamp: string;
}

export const DebugLogger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(true); // 临时设为可见以调试
  const [isMinimized, setIsMinimized] = useState(false);
  const logIdRef = useRef(0); // 使用 ref 保持 ID 递增

  useEffect(() => {
    // Intercept console.log
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (message: string, type: 'info' | 'error' | 'success') => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => {
        const newLogs = [...prev, { id: logIdRef.current++, message, type, timestamp }];
        // Keep only last 20 logs
        return newLogs.slice(-20);
      });
    };

    console.log = function(...args) {
      originalLog.apply(console, args);
      const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return '[Object]';
          }
        }
        return String(arg);
      }).join(' ');
      addLog(message, 'info');
    };

    console.error = function(...args) {
      originalError.apply(console, args);
      const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return '[Object]';
          }
        }
        return String(arg);
      }).join(' ');
      addLog(message, 'error');
    };

    console.warn = function(...args) {
      originalWarn.apply(console, args);
      const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return '[Object]';
          }
        }
        return String(arg);
      }).join(' ');
      addLog(message, 'error');
    };

    // Initial log
    addLog('Debug logger initialized', 'success');

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg text-xs"
      >
        Show Logs
      </button>
    );
  }

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'inset-4'} z-50 flex flex-col bg-black/95 border border-blue-500 rounded-lg shadow-2xl`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-600 text-white px-3 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-bold text-sm">Debug Console</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            {isMinimized ? '□' : '_'}
          </button>
          <button
            onClick={() => setLogs([])}
            className="text-white hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No logs yet...</div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className={`p-2 rounded ${
                  log.type === 'error' ? 'bg-red-900/50 text-red-200' :
                  log.type === 'success' ? 'bg-green-900/50 text-green-200' :
                  'bg-blue-900/30 text-blue-100'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-[10px] mt-0.5">{log.timestamp}</span>
                  <span className={`font-bold ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    'text-blue-400'
                  }`}>
                    {log.type === 'error' ? '✕' : log.type === 'success' ? '✓' : '•'}
                  </span>
                  <span className="flex-1 break-all">{log.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Minimized preview */}
      {isMinimized && logs.length > 0 && (
        <div className="p-2 text-xs text-gray-300 font-mono truncate">
          {logs[logs.length - 1].message}
        </div>
      )}
    </div>
  );
};

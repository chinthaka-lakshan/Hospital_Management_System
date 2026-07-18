import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';

const LogViewer = () => {
  const [logs, setLogs] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/logs');
      setLogs(response.data.logs || 'No logs available.');
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs('Failed to fetch logs. You might not have permission.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">System Logs</h2>
        <button 
          onClick={fetchLogs}
          disabled={isLoading}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh Logs
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-inner border border-gray-800">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-400 font-mono ml-2">laravel.log</span>
        </div>
        <pre className="p-4 text-xs font-mono text-green-400 h-96 overflow-y-auto whitespace-pre-wrap break-all">
          {isLoading ? 'Fetching latest logs...' : logs}
        </pre>
      </div>
    </div>
  );
};

export default LogViewer;

import React, { useEffect, useState } from 'react';
import { Play, Loader2, CheckCircle2, AlertCircle, Server, Search, Database, FileText } from 'lucide-react';
import { AgentRunStats, RunPhase } from './types';
import { API } from './api';

export const AgentRunner: React.FC = () => {
  const [stats, setStats] = useState<AgentRunStats>({
    phase: 'idle',
    progress: 0,
    message: 'Connecting to agent...',
    startTime: null,
    itemsProcessed: 0,
    totalItems: 0
  });

  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Poll status every 1 second for smoother UI
    const poll = setInterval(async () => {
      const newStats = await API.getAgentStatus();
      setStats(newStats);
    }, 1000);
    
    // Initial fetch
    API.getAgentStatus().then(setStats);

    return () => clearInterval(poll);
  }, []);
  
  // Auto-start for demo/testing purposes
  useEffect(() => {
     const init = async () => {
         const s = await API.getAgentStatus();
         // Only auto-start if completely fresh (items processed is 0 and idle)
         if (s.phase === 'idle' && s.totalItems === 0) {
             handleRun();
         }
     };
     init();
  }, []);

  const handleRun = async () => {
    try {
      setIsStarting(true);
      await API.startAgentRun();
      // Force an immediate update
      const newStats = await API.getAgentStatus();
      setStats(newStats);
    } catch (error) {
      console.error("Failed to start agent:", error);
      alert("Failed to start the agent. Check console for details.");
    } finally {
      setIsStarting(false);
    }
  };

  const getPhaseIcon = (phase: RunPhase) => {
    switch (phase) {
      case 'bdx_sync': return <Database className="w-5 h-5 animate-pulse text-blue-500" />;
      case 'scout': return <Search className="w-5 h-5 animate-bounce text-purple-500" />;
      case 'scrape': return <Server className="w-5 h-5 animate-pulse text-orange-500" />;
      case 'analyze': return <FileText className="w-5 h-5 animate-pulse text-green-500" />;
      case 'complete': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Server className="w-5 h-5 text-gray-400" />;
    }
  };

  const isRunning = stats.phase !== 'idle' && stats.phase !== 'complete' && stats.phase !== 'error';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">CMA Agent Controller</h2>
          <p className="text-sm text-gray-500">Orchestrates BDX Sync, Scout, Scraping, and Analysis</p>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || isStarting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRunning || isStarting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          }`}
        >
          {isRunning || isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isStarting ? 'Starting...' : isRunning ? 'Agent Running...' : 'Run Analysis Agent'}
        </button>
      </div>

      <div className="relative">
        {/* Progress Bar Background */}
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${stats.progress}%` }}
          />
        </div>

        {/* Phase Indicators */}
        <div className="flex justify-between mt-4 relative">
            <PhaseStep label="BDX Sync" active={stats.phase === 'bdx_sync'} completed={stats.progress >= 20 && stats.phase !== 'bdx_sync'} />
            <PhaseStep label="Scout" active={stats.phase === 'scout'} completed={stats.progress > 40 && stats.phase !== 'scout'} />
            <PhaseStep label="Scrape (MCP)" active={stats.phase === 'scrape'} completed={stats.progress > 70 && stats.phase !== 'scrape'} />
            <PhaseStep label="Analyze" active={stats.phase === 'analyze'} completed={stats.progress > 90 && stats.phase !== 'analyze'} />
            <PhaseStep label="Done" active={stats.phase === 'complete'} completed={stats.phase === 'complete'} />
        </div>

        {/* Console Output */}
        <div className={`mt-6 rounded-lg p-4 font-mono text-xs min-h-[80px] flex items-center gap-3 shadow-inner transition-colors ${
            stats.phase === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-900 text-green-400'
        }`}>
           {getPhaseIcon(stats.phase)}
           <span>
             <span className={stats.phase === 'error' ? 'text-red-400' : 'text-slate-500'}>
               [{new Date().toLocaleTimeString()}]
             </span> {stats.message}
           </span>
        </div>
      </div>
    </div>
  );
};

const PhaseStep: React.FC<{ label: string; active: boolean; completed: boolean }> = ({ label, active, completed }) => (
  <div className={`flex flex-col items-center gap-2 ${active ? 'scale-110' : 'opacity-60'} transition-all`}>
    <div className={`w-3 h-3 rounded-full ${completed ? 'bg-indigo-600' : active ? 'bg-indigo-400 animate-ping' : 'bg-gray-300'}`} />
    <span className={`text-xs font-medium ${completed || active ? 'text-indigo-900' : 'text-gray-400'}`}>{label}</span>
  </div>
);
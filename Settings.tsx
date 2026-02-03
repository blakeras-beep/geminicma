import React, { useEffect, useState } from 'react';
import { Save, Database, Clock, Loader2, Check, XCircle, Activity, Cpu, ShieldAlert } from 'lucide-react';
import { API } from './api';
import { SystemConfig, SystemHealth } from './types';

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    bdxFeedUrl: '',
    searchRadius: 15,
    scrapeFrequencyHours: 24
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    API.getConfig().then((data) => {
        setConfig(data);
        setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
        await API.updateConfig(config);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    } catch (err) {
        console.error(err);
    } finally {
        setSaving(false);
    }
  };
  
  const handleDiagnostics = async () => {
      setTesting(true);
      setHealth({ bdxStatus: 'checking', aiStatus: 'checking', message: 'Attempting connection...' });
      try {
          const res = await API.runDiagnostics();
          setHealth(res);
      } catch (e: any) {
          setHealth({ bdxStatus: 'error', aiStatus: 'error', message: `Diagnostics Error: ${e.message}` });
      } finally {
          setTesting(false);
      }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Diagnostics Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            System Connectivity
          </h3>
          <button
              onClick={handleDiagnostics}
              disabled={testing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors flex items-center gap-2"
          >
              {testing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Activity className="w-3 h-3"/>}
              Test Connection
          </button>
        </div>
        
        <div className="p-6">
           {health && (
               <div className="space-y-4">
                  <div className={`p-4 rounded-lg border flex items-center justify-between ${
                    health.bdxStatus === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      {health.bdxStatus === 'ok' ? <Check className="w-5 h-5"/> : <ShieldAlert className="w-5 h-5"/>}
                      <div>
                        <p className="text-sm font-bold">API Status</p>
                        <p className="text-xs opacity-80">{health.message}</p>
                      </div>
                    </div>
                  </div>
                  
                  {health.bdxStatus === 'error' && (
                    <div className="text-xs bg-gray-900 text-gray-300 p-3 rounded font-mono">
                       <p className="text-indigo-400 mb-1">// Debugging Tips:</p>
                       <p>1. Open Browser Console (F12) > Network</p>
                       <p>2. Look for requests to: geminicma-production.up.railway.app</p>
                       <p>3. If status is (canceled) or 404, verify Public URL in Railway Settings.</p>
                    </div>
                  )}
               </div>
           )}
           {!health && (
             <p className="text-sm text-gray-500 text-center py-4">Click "Test Connection" to check if the backend is reachable.</p>
           )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            Configuration
          </h3>
        </div>
        <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BDX Feed URL</label>
              <input 
                  type="text" 
                  value={config.bdxFeedUrl}
                  onChange={(e) => setConfig({...config, bdxFeedUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Radius (Miles)</label>
                  <input 
                      type="number" 
                      value={config.searchRadius}
                      onChange={(e) => setConfig({...config, searchRadius: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scrape Frequency (Hrs)</label>
                  <input 
                      type="number" 
                      value={config.scrapeFrequencyHours}
                      onChange={(e) => setConfig({...config, scrapeFrequencyHours: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
            </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-all"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4"/>}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Config'}
            </button>
        </div>
      </div>
    </div>
  );
};
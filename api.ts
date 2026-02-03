import { AgentRunStats, Alert, Competitor, CompetitorAssignment, SystemConfig, SystemHealth } from './types';

/**
 * Robust API Base URL
 * In production, the backend serves the frontend, so we use the current origin.
 */
const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  
  // Handle local development where frontend (Vite) and backend (FastAPI) might be on different ports
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return 'http://localhost:8000';
  }
  
  return origin;
};

const BASE_URL = getBaseUrl();

const fetcher = async (endpoint: string, options?: RequestInit) => {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server Error (${response.status}): ${text}`);
    }
    
    return await response.json();
  } catch (err: any) {
    console.error(`[CMA API] Error at ${url}:`, err);
    throw err;
  }
};

export const API = {
  getAgentStatus: async (): Promise<AgentRunStats> => fetcher('/api/agent/status'),
  startAgentRun: async (): Promise<void> => fetcher('/api/agent/run', { method: 'POST' }),
  getAssignments: async (): Promise<CompetitorAssignment[]> => fetcher('/api/scout/assignments'),
  verifyAssignment: async (id: string, action: 'verify' | 'reject'): Promise<void> => 
    fetcher(`/api/scout/verify/${id}/${action}`, { method: 'POST' }),
  getCompetitors: async (): Promise<Competitor[]> => fetcher('/api/competitors'),
  getAlerts: async (): Promise<Alert[]> => fetcher('/api/alerts'),
  getConfig: async (): Promise<SystemConfig> => ({ 
    bdxFeedUrl: "https://feed.mybuildercloud.com/bdx/26016593903.xml", 
    searchRadius: 10, 
    scrapeFrequencyHours: 24 
  }),
  updateConfig: async (config: SystemConfig): Promise<void> => { console.log('Config updated', config); },
  runDiagnostics: async (): Promise<SystemHealth> => {
    try {
      const start = Date.now();
      const res = await fetch(`${BASE_URL}/api/health`);
      const duration = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        return { 
          bdxStatus: 'ok', 
          aiStatus: 'ok', 
          message: `Successfully connected to backend at ${BASE_URL} (${duration}ms). DB Status: ${data.db}` 
        };
      }
      throw new Error();
    } catch (e) {
      return { 
        bdxStatus: 'error', 
        aiStatus: 'error', 
        message: `Failed to reach backend at ${BASE_URL}. Ensure the service is active on Railway.` 
      };
    }
  }
};
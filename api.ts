import { AgentRunStats, Alert, Competitor, CompetitorAssignment, SystemConfig, SystemHealth } from './types';

/**
 * API Client
 * Uses relative paths to leverage Vite proxy in development and same-origin in production.
 */
const BASE_URL = '';

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
    
    // Check if we got an HTML response (usually a 404 page or server error page)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
        throw new Error(`Endpoint not found (404). The server returned HTML instead of JSON. Ensure the backend is running.`);
    }
    
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
      const res = await fetch(`/api/health`);
      const duration = Date.now() - start;
      if (res.ok) {
        // const data = await res.json();
        return { 
          bdxStatus: 'ok', 
          aiStatus: 'ok', 
          message: `Connected to backend (${duration}ms).` 
        };
      }
      throw new Error("Health check failed");
    } catch (e) {
      return { 
        bdxStatus: 'error', 
        aiStatus: 'error', 
        message: `Failed to reach backend. Ensure the Python server is running on port 8000.` 
      };
    }
  }
};

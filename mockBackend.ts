import { AgentRunStats, Alert, Competitor, CompetitorAssignment } from './types';

// Initial Mock Data
let MOCK_ASSIGNMENTS: CompetitorAssignment[] = [
  { id: '1', sandlinCommunity: 'Legacy Crossing', builderName: 'D.R. Horton', detectedName: 'DR Horton - South', realName: 'Timber Creek', url: 'https://drhorton.com/...', alignmentScore: 85, distanceMiles: 1.2, status: 'verified' },
  { id: '2', sandlinCommunity: 'Legacy Crossing', builderName: 'Lennar', detectedName: 'Lennar at Wildflower', realName: null, url: null, alignmentScore: 65, distanceMiles: 4.5, status: 'pending' },
  { id: '3', sandlinCommunity: 'Country Lakes', builderName: 'HistoryMaker', detectedName: 'HistoryMaker Argyle', realName: 'Country Lakes South', url: 'https://historymaker.com/...', alignmentScore: 92, distanceMiles: 0.5, status: 'verified' },
  { id: '4', sandlinCommunity: 'Palomino Estates', builderName: 'Bloomfield', detectedName: 'Bloomfield Homes', realName: null, url: null, alignmentScore: 45, distanceMiles: 12.0, status: 'pending' },
];

let MOCK_COMPETITORS: Competitor[] = [
  { 
    id: 'c1', name: 'Timber Creek', builder: 'D.R. Horton', lastScraped: '2023-10-24T10:00:00', 
    priceMin: 350000, priceMax: 450000, alerts: 1, alignmentScore: 85,
    specs: [{ price: 360000, sqft: 2100, bed: 3, bath: 2, status: 'Available' }] 
  },
  { 
    id: 'c2', name: 'Country Lakes South', builder: 'HistoryMaker', lastScraped: '2023-10-24T10:05:00', 
    priceMin: 400000, priceMax: 550000, alerts: 2, alignmentScore: 92,
    specs: [{ price: 420000, sqft: 2400, bed: 4, bath: 3, status: 'Available' }] 
  },
];

let MOCK_ALERTS: Alert[] = [
  { id: 'a1', competitorId: 'c1', competitorName: 'Timber Creek', type: 'price_change', severity: 'high', message: 'Price dropped by $15k on plan 2400', date: '2 hrs ago', valueChange: -15000 },
  { id: 'a2', competitorId: 'c2', competitorName: 'Country Lakes South', type: 'inventory_low', severity: 'medium', message: 'Inventory dropped below 3 units', date: '5 hrs ago' },
];

// Simulation State
let currentRun: AgentRunStats = {
  phase: 'idle',
  progress: 0,
  message: 'Ready to start',
  startTime: null,
  itemsProcessed: 0,
  totalItems: 0
};

// Simulation Logic
export const MockBackend = {
  getStats: async (): Promise<AgentRunStats> => {
    return { ...currentRun };
  },

  getAssignments: async (): Promise<CompetitorAssignment[]> => {
    return [...MOCK_ASSIGNMENTS];
  },

  getCompetitors: async (): Promise<Competitor[]> => {
    return [...MOCK_COMPETITORS];
  },

  getAlerts: async (): Promise<Alert[]> => {
    return [...MOCK_ALERTS];
  },

  verifyAssignment: async (id: string, action: 'verify' | 'reject') => {
    MOCK_ASSIGNMENTS = MOCK_ASSIGNMENTS.map(a => 
      a.id === id ? { ...a, status: action === 'verify' ? 'verified' : 'rejected' } : a
    );
    if (action === 'verify') {
      // Logic to move assignment to competitor would go here
    }
  },

  startRun: async () => {
    if (currentRun.phase !== 'idle' && currentRun.phase !== 'complete' && currentRun.phase !== 'error') return;
    
    currentRun = { phase: 'bdx_sync', progress: 5, message: 'Syncing Sandlin Communities from BDX...', startTime: Date.now(), itemsProcessed: 0, totalItems: 12 };
    
    // Simulate Phase 1: BDX Sync
    setTimeout(() => {
      currentRun = { ...currentRun, phase: 'scout', progress: 20, message: 'Scouting for competitors (15 mile radius)...', itemsProcessed: 0, totalItems: 54 }; // 54 builders
    }, 2000);

    // Simulate Phase 2: Scout
    setTimeout(() => {
      // Simulate finding new items
      MOCK_ASSIGNMENTS.push({
        id: Math.random().toString(),
        sandlinCommunity: 'Willow Wood',
        builderName: 'Pulte',
        detectedName: 'Pulte at Willow',
        realName: null,
        url: null,
        alignmentScore: 78,
        distanceMiles: 3.2,
        status: 'pending'
      });
      currentRun = { ...currentRun, phase: 'scrape', progress: 45, message: 'Running MCP Scraper (Claude + Playwright)...', itemsProcessed: 0, totalItems: MOCK_COMPETITORS.length };
    }, 5000);

    // Simulate Phase 3: Scrape
    setTimeout(() => {
      currentRun = { ...currentRun, progress: 60, message: 'Extracting specs and promotions...', itemsProcessed: 1, totalItems: 2 };
    }, 7000);

    setTimeout(() => {
      currentRun = { ...currentRun, progress: 75, message: 'Scraping complete. Processing data...', itemsProcessed: 2, totalItems: 2 };
    }, 9000);

    // Simulate Phase 4: Analyze
    setTimeout(() => {
      currentRun = { ...currentRun, phase: 'analyze', progress: 90, message: 'Generating Coordinator Notes via Claude...', itemsProcessed: 0, totalItems: 1 };
    }, 10000);

    // Complete
    setTimeout(() => {
      currentRun = { ...currentRun, phase: 'complete', progress: 100, message: 'CMA Run Complete', itemsProcessed: 0, totalItems: 0 };
    }, 12000);
  }
};
export type RunPhase = 'idle' | 'bdx_sync' | 'scout' | 'scrape' | 'analyze' | 'complete' | 'error';

export interface AgentRunStats {
  phase: RunPhase;
  progress: number; // 0-100
  message: string;
  startTime: number | null;
  itemsProcessed: number;
  totalItems: number;
}

export interface CompetitorAssignment {
  id: string;
  sandlinCommunity: string;
  builderName: string;
  detectedName: string; // "D.R. Horton near Waxahachie"
  realName: string | null; // "North Grove"
  url: string | null;
  alignmentScore: number;
  distanceMiles: number;
  status: 'pending' | 'verified' | 'rejected';
}

export interface CompetitorSpec {
  price: number;
  sqft: number;
  bed: number;
  bath: number;
  status: 'Available' | 'Sold' | 'Pending';
}

export interface Competitor {
  id: string;
  name: string;
  builder: string;
  lastScraped: string;
  priceMin: number;
  priceMax: number;
  specs: CompetitorSpec[];
  alerts: number;
  alignmentScore: number;
}

export interface Alert {
  id: string;
  competitorId: string;
  competitorName: string;
  type: 'price_change' | 'inventory_low' | 'new_listing';
  severity: 'high' | 'medium' | 'low';
  message: string;
  date: string;
  valueChange?: number; // e.g. -5000
}

export interface SystemConfig {
  bdxFeedUrl: string;
  searchRadius: number;
  scrapeFrequencyHours: number;
}

export interface SystemHealth {
    bdxStatus: 'ok' | 'error' | 'checking';
    aiStatus: 'ok' | 'error' | 'checking';
    message: string;
}
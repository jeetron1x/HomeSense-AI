export type TabType = 'scan' | 'summary' | 'monitor' | 'appliances' | 'settings';

export type ThemeMode = 'dark' | 'light';

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  address?: string;
  propertyName: string;
  propertyUnit: string;
  meshNodeId: string;
  tier: 'Pro Sense' | 'Standard Hub' | 'Enterprise';
  avatarInitials: string;
  joinedDate: string;
}

export interface Appliance {
  id: string;
  name: string;
  model: string;
  category: 'hvac' | 'refrig' | 'laundry' | 'other';
  location: string;
  starRating: number;
  maxStars?: number;
  certTitle: string;
  efficiencyMetric: string;
  efficiencyValue: string;
  powerDrawWatts: number;
  status: string;
  statusColor?: string;
  acousticVibration?: string;
  loadIndex?: string;
  annualKwh?: number;
  estimatedAnnualSavingsInr?: number;
  isEcoMode?: boolean;
}

export interface AnomalyItem {
  id: string;
  title: string;
  description: string;
  category: 'acoustic' | 'power' | 'standby';
  severity: 'high' | 'medium' | 'low';
  estimatedCostImpactInr?: number;
  costImpactInr?: number;
  timeWindow?: string;
  timestamp?: string;
  icon?: string;
  resolved?: boolean;
}

export interface AcousticTelemetry {
  sampleRate: string;
  bitDepth?: string;
  snrDb: number;
  noiseFloorDbfs: number;
  fftSize: number;
  peakFrequencyHz: number;
  vibrationIndexG: number;
  spectralFluxDeltaS: number;
  status: 'active' | 'paused';
  sensitivity: 'Low' | 'Med' | 'High' | 'Ultra';
  isMuted: boolean;
}

export interface OfficeKitSyncData {
  connectedDevice: string;
  ipAddress: string;
  jitterMs: number;
  lastSynced: string;
  clipboardSynced: boolean;
  totalKwhTracked: number;
  currentCycleSpendInr: number;
  activeAnomaliesCount: number;
}


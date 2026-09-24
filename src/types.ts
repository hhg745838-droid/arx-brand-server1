export type TabType = 'PREDICT' | 'HISTORY' | 'GAME' | 'DB' | 'PROFILE';
export type ServerType = 'ARX BRAND SERVER 1 MODS' | 'SERVER 2';
export type GameMode = 'WINGO_30S' | 'WINGO_1M';

export const APP_LOGO = 'https://i.postimg.cc/sxB74TxX/file-00000000097c81f5abb566d8a5f9d2ff.png';
export const BRAND_MOD_NAME = 'ARX BRAND SERVER 1 MODS';
export const MAIN_HEADER_NAME = 'ARX BRAND SERVER 1 UPDATE';
export const TELEGRAM_CHANNEL_URL = 'https://t.me/COLUR_TRADING_HACKER';
export const DEVELOPER_TELEGRAM_URL = 'https://t.me/Owner_Not_perfect';

export interface RawApiIssue {
  issueNumber: string;
  number: string | number;
  color: string;
  premium?: string | number;
  sum?: number;
  issue?: string;
  period?: string;
  periodNumber?: string;
  drawNumber?: string | number;
  result?: string | number;
}

export interface DrawItem {
  period: string;
  number: number;
  size: 'BIG' | 'SMALL';
  color: 'RED' | 'GREEN' | 'VIOLET' | 'RED+VIOLET' | 'GREEN+VIOLET';
  rawColor?: string;
  premium?: number;
  timestamp: number;
}

export interface PredictionResult {
  period: string;
  server: ServerType;
  side: 'BIG' | 'SMALL';
  number: number;
  opposite: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  accuracyPercent: number;
  weightedConsensus: number;
  modelUsed: string;
  batchInfo: string;
  formulaDetails: string;
  timestamp: number;
}

export interface HistoryRecord {
  id: string;
  period: string;
  server: ServerType;
  gameMode?: GameMode;
  predictedSide: 'BIG' | 'SMALL';
  predictedNumber: number;
  actualNumber?: number;
  actualSide?: 'BIG' | 'SMALL';
  result: 'WIN' | 'LOSS' | 'WAIT';
  logic: string;
  timestamp: number;
}

export interface AIModelWeight {
  id: string;
  name: string;
  accuracyRate: number; // e.g. 100 for 100%
  hitsStr: string; // e.g. "(1/1)"
  weight: number; // e.g. 1.03
  status: 'active' | 'evaluating' | 'guard';
}

export interface UserProfile {
  accessKey: string;
  maskedKey: string;
  status: 'ACTIVE' | 'EXPIRED';
  expiryText: string;
  deviceBinding: string;
  lifetimeAccuracy: number;
  totalPredictions: number;
  wins: number;
  winStreak: number;
  soundEnabled: boolean;
  avatarUrl?: string;
}

export interface AdminKeyItem {
  key: string;
  active: boolean;
  status: 'active' | 'inactive' | 'expired';
  plan: string;
  createdAt: number;
  expiresAt: number | null;
  expiryText: string;
  durationText: string;
  note?: string;
  isLifetime?: boolean;
  rawData?: any;
}

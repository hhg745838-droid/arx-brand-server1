import { DrawItem, GameMode, RawApiIssue } from '../types';

export const REAL_API_URLS = {
  WINGO_30S: 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json',
  WINGO_1M: 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json',
};

/**
 * Parses raw color string from the real API: e.g. "red", "green", "green,violet", "red,violet"
 */
export function parseApiColor(colorStr: string, num: number): DrawItem['color'] {
  const c = String(colorStr || '').toLowerCase();
  if (c.includes('violet') || c.includes('purple')) {
    if (c.includes('red') || num === 0) return 'RED+VIOLET';
    if (c.includes('green') || num === 5) return 'GREEN+VIOLET';
    return 'VIOLET';
  }
  if (c.includes('red')) return 'RED';
  if (c.includes('green')) return 'GREEN';

  // Fallback by number standard
  if (num === 0) return 'RED+VIOLET';
  if (num === 5) return 'GREEN+VIOLET';
  return [2, 4, 6, 8].includes(num) ? 'RED' : 'GREEN';
}

/**
 * Calculates current period and remaining time in cycle
 */
export function getCycleState(mode: GameMode = 'WINGO_1M', latestApiIssue?: string): {
  remainingSeconds: number;
  progressPercent: number;
  periodNumber: string;
} {
  const now = new Date();
  const totalSeconds = mode === 'WINGO_30S' ? 30 : 60;
  const currentSeconds = (now.getMinutes() * 60 + now.getSeconds()) % totalSeconds;
  const remainingSeconds = totalSeconds - (now.getSeconds() % totalSeconds);
  const progressPercent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  let periodNumber: string;
  if (latestApiIssue && latestApiIssue.length >= 8) {
    try {
      const bInt = BigInt(latestApiIssue);
      periodNumber = String(bInt + 1n);
    } catch {
      periodNumber = latestApiIssue;
    }
  } else {
    // Generate standard WinGo 8-digit period format
    const dayMinutes = now.getHours() * 60 + now.getMinutes();
    const indexInDay = mode === 'WINGO_30S'
      ? dayMinutes * 2 + Math.floor(now.getSeconds() / 30)
      : dayMinutes;
    const baseNum = 80860000 + (indexInDay % 10000);
    periodNumber = String(baseNum);
  }

  return {
    remainingSeconds: remainingSeconds === 0 ? totalSeconds : remainingSeconds,
    progressPercent,
    periodNumber,
  };
}

/**
 * Computes next issue number from current issue string using BigInt
 */
export function computeNextIssue(currentIssue: string): string {
  if (!currentIssue) return '';
  try {
    const b = BigInt(currentIssue);
    return String(b + 1n);
  } catch {
    const num = parseInt(currentIssue, 10);
    return !isNaN(num) ? String(num + 1) : currentIssue;
  }
}

/**
 * Normalizes raw API issue item into application DrawItem
 */
export function normalizeApiIssue(raw: RawApiIssue | Record<string, any>): DrawItem {
  const r = raw as any;
  const issueStr = String(r.issueNumber || r.issue || r.period || r.periodNumber || '');
  const num = parseInt(String(r.number ?? r.drawNumber ?? r.result ?? 0), 10);
  const size: 'BIG' | 'SMALL' = num >= 5 ? 'BIG' : 'SMALL';
  const color = parseApiColor(r.color || '', num);
  const premium = r.premium !== undefined ? parseInt(String(r.premium), 10) : num;

  return {
    period: issueStr,
    number: num,
    size,
    color,
    rawColor: r.color,
    premium,
    timestamp: Date.now(),
  };
}

/**
 * Deterministic generator fallback if network is completely unreachable
 */
export function generateDrawResult(period: string): DrawItem {
  let hash = 0;
  for (let i = 0; i < period.length; i++) {
    hash = (hash << 5) - hash + period.charCodeAt(i);
    hash |= 0;
  }
  const num = Math.abs(hash) % 10;
  const size: 'BIG' | 'SMALL' = num >= 5 ? 'BIG' : 'SMALL';
  const color = parseApiColor(num % 2 === 0 ? 'red' : 'green', num);

  return {
    period,
    number: num,
    size,
    color,
    premium: num,
    timestamp: Date.now(),
  };
}

export function getInitialDraws(currentPeriod: string, count: number = 20): DrawItem[] {
  const list: DrawItem[] = [];
  try {
    const b = BigInt(currentPeriod);
    for (let i = 1; i <= count; i++) {
      const p = String(b - BigInt(i));
      list.push(generateDrawResult(p));
    }
  } catch {
    const base = parseInt(currentPeriod, 10) || 80865688;
    for (let i = 1; i <= count; i++) {
      list.push(generateDrawResult(String(base - i)));
    }
  }
  return list;
}

/**
 * Live Fetcher for real Game API:
 * Handles server proxy (/api/history), direct fetch, and CORS proxy with timeout
 */
export async function fetchLiveDrawHistory(mode: GameMode = 'WINGO_1M'): Promise<{
  items: DrawItem[];
  latestIssue: string;
  source: string;
} | null> {
  const endpoints = [
    // 1. Internal Express server proxy (CORS safe, fast)
    `/api/history?mode=${mode}`,
    // 2. Direct upstream API
    REAL_API_URLS[mode],
    // 3. Fallback CORS proxy
    `https://api.allorigins.win/raw?url=${encodeURIComponent(REAL_API_URLS[mode])}`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const json = await res.json();

      // Extract array from standard or proxy response
      let rawList: any[] = [];
      if (Array.isArray(json)) {
        rawList = json;
      } else if (json?.data?.list && Array.isArray(json.data.list)) {
        rawList = json.data.list;
      } else if (json?.list && Array.isArray(json.list)) {
        rawList = json.list;
      } else if (json?.data && Array.isArray(json.data)) {
        rawList = json.data;
      }

      if (rawList.length > 0) {
        const normalized = rawList.map((it) => normalizeApiIssue(it));
        const latestIssue = normalized[0]?.period || '';
        const sourceName = url.startsWith('/api')
          ? 'Live ARX Cloud Proxy'
          : url.includes('ar-lottery01')
          ? 'Direct AR Lottery'
          : 'Mirror Proxy';

        return {
          items: normalized,
          latestIssue,
          source: sourceName,
        };
      }
    } catch {
      // Try next endpoint
    }
  }

  return null;
}

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for API routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

const API_ENDPOINTS = {
  WINGO_30S: 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json',
  WINGO_1M: 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json',
};

// Rate limiting map for brute-force protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }
  if (record.count >= 15) {
    return true;
  }
  record.count += 1;
  return false;
}

function formatRemainingTime(expireMs: number): string {
  const diff = expireMs - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  return `${hours}h ${minutes}m ${seconds}s`;
}

// -------------------------------------------------------------
// SECURE SERVER-SIDE VIP KEY VERIFICATION (DATABASE HIDDEN & SHIELDED)
// -------------------------------------------------------------
app.post('/api/verify-key', async (req: Request, res: Response) => {
  const clientIp = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';

  if (isRateLimited(clientIp)) {
    res.status(429).json({
      valid: false,
      message: 'Too many attempts. Security cool-down active. Please try again in 1 minute.',
    });
    return;
  }

  const { key } = req.body;
  if (!key || typeof key !== 'string') {
    res.status(400).json({ valid: false, message: 'VIP Key is required.' });
    return;
  }

  const trimmed = key.trim();
  const upper = trimmed.toUpperCase();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    // Query backend Firebase Realtime Database without exposing to client
    const upstreamUrl = 'https://abirhackadmin-default-rtdb.firebaseio.com/keys.json';
    const upstreamRes = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      throw new Error(`DB returned status ${upstreamRes.status}`);
    }

    const allKeysObj: Record<string, any> = await upstreamRes.json();
    let matchedData: any = null;
    let matchedKeyName: string = trimmed;

    if (allKeysObj && typeof allKeysObj === 'object') {
      if (allKeysObj[trimmed] !== undefined) {
        matchedData = allKeysObj[trimmed];
        matchedKeyName = trimmed;
      } else if (allKeysObj[upper] !== undefined) {
        matchedData = allKeysObj[upper];
        matchedKeyName = upper;
      } else {
        // Deep search keys
        for (const [k, v] of Object.entries(allKeysObj)) {
          if (v && typeof v === 'object') {
            if (
              v.key === trimmed ||
              v.key === upper ||
              v.id === trimmed ||
              v.id === upper ||
              k.toLowerCase() === trimmed.toLowerCase()
            ) {
              matchedData = v;
              matchedKeyName = v.key || k;
              break;
            }
          }
        }
      }
    }

    if (matchedData !== null && matchedData !== undefined) {
      // Direct boolean key
      if (matchedData === true) {
        res.json({
          valid: true,
          plan: 'VIP ACCESS',
          expiryText: 'Lifetime VIP Access',
        });
        return;
      }

      if (typeof matchedData === 'object') {
        if (matchedData.status) {
          const st = String(matchedData.status).toLowerCase();
          if (st === 'inactive' || st === 'blocked' || st === 'expired' || st === 'banned') {
            res.json({
              valid: false,
              message: `এই কী-টি নিষ্ক্রিয় বা বন্ধ আছে (${matchedData.status})।`,
            });
            return;
          }
        }

        if (matchedData.active === false) {
          res.json({
            valid: false,
            message: 'এই কী-টি নিষ্ক্রিয় করা হয়েছে (Key Inactive)।',
          });
          return;
        }

        const expireTimestamp =
          matchedData.expiresAt ||
          matchedData.expires ||
          matchedData.expiry ||
          null;

        if (expireTimestamp && typeof expireTimestamp === 'number') {
          if (expireTimestamp < Date.now()) {
            res.json({
              valid: false,
              message: 'এই VIP কী-এর মেয়াদ শেষ হয়েছে (Key Expired)।',
            });
            return;
          }
        }

        let expiryText = '30d 00h 00m 00s';
        if (expireTimestamp && typeof expireTimestamp === 'number') {
          expiryText = formatRemainingTime(expireTimestamp);
        } else if (matchedData.duration_hours) {
          expiryText = `${matchedData.duration_hours} Hours Access`;
        } else if (matchedData.durationDays) {
          expiryText = `${matchedData.durationDays} Days VIP`;
        }

        res.json({
          valid: true,
          plan: matchedData.plan || matchedData.type || 'PAID VIP',
          expiryText,
        });
        return;
      }
    }

    // Key not found
    res.json({
      valid: false,
      message: 'ভুল VIP কী! ডাটাবেস এডমিন প্যানেলের সঠিক পেইড কী প্রদান করুন।',
    });
  } catch (err: any) {
    console.error('[Verify Key Backend Error]:', err?.message || err);
    res.status(500).json({
      valid: false,
      message: 'সিকিউর সার্ভার কানেকশন এরর। পুনরায় চেষ্টা করুন।',
    });
  }
});

// Real Game API Proxy Endpoint
app.get('/api/history', async (req: Request, res: Response) => {
  const mode = (req.query.mode as string)?.toUpperCase() === 'WINGO_30S' ? 'WINGO_30S' : 'WINGO_1M';
  const targetUrl = API_ENDPOINTS[mode];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const upstreamRes = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
    });

    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      throw new Error(`Upstream returned ${upstreamRes.status}`);
    }

    const text = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Failed to parse upstream JSON');
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      mode,
      source: 'live-api',
      timestamp: Date.now(),
      data: data?.data || data,
    });
  } catch (err: any) {
    console.error(`[API Proxy Error - ${mode}]:`, err?.message || err);
    res.status(502).json({
      success: false,
      mode,
      error: err?.message || 'Proxy upstream fetch error',
      timestamp: Date.now(),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for API routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
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

const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || 'https://abirhackadmin-default-rtdb.firebaseio.com';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'abirta009';
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'ARX_HMAC_SHA256_abirta009_VIP_SECURE_TOKEN';

// Generate Cryptographic HMAC-SHA256 Encrypted VIP Key
function generateSecureEncryptedKey(prefix: string, durationCode: string, nowMs: number, expiresAt: number | null): { key: string; signature: string } {
  const nonce = crypto.randomBytes(3).toString('hex').toUpperCase();
  const rawPayload = `${prefix}:${durationCode}:${nowMs}:${expiresAt || 0}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', ENCRYPTION_SECRET)
    .update(rawPayload)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  const formattedKey = `${prefix}-ENC-${durationCode}-${nonce}-${signature}`;
  return { key: formattedKey, signature };
}

// Rate limiting map for brute-force protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }
  if (record.count >= 25) {
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

  // Instant Master Dev Key access
  if (upper === 'ARX-VIP-1029-ALPHA' || upper === 'ARX-MASTER-DEV-VIP') {
    res.json({
      valid: true,
      plan: 'MASTER DEV VIP',
      expiryText: 'Lifetime VIP Access',
    });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    // Query backend Firebase Realtime Database without exposing to client
    const upstreamUrl = `${FIREBASE_RTDB_URL}/keys.json`;
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

        let expireTimestamp =
          matchedData.expiresAt ||
          matchedData.expires ||
          matchedData.expiry ||
          null;

        if (!expireTimestamp && matchedData.duration_hours) {
          const created = matchedData.createdAt || (matchedData.created_at ? new Date(matchedData.created_at).getTime() : 0);
          if (created) {
            expireTimestamp = created + Number(matchedData.duration_hours) * 3600 * 1000;
          }
        } else if (!expireTimestamp && matchedData.durationDays) {
          const created = matchedData.createdAt || matchedData.timestamp || 0;
          if (created) {
            expireTimestamp = created + Number(matchedData.durationDays) * 86400 * 1000;
          }
        }

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
        if (matchedData.lifetime || matchedData.isLifetime) {
          expiryText = 'Lifetime VIP Access';
        } else if (expireTimestamp && typeof expireTimestamp === 'number') {
          expiryText = formatRemainingTime(expireTimestamp);
        } else if (matchedData.duration_hours) {
          expiryText = `${matchedData.duration_hours} Hours Access`;
        } else if (matchedData.durationDays) {
          expiryText = `${matchedData.durationDays} Days VIP`;
        } else {
          expiryText = 'Active VIP Access';
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

// -------------------------------------------------------------
// ADMIN LOGIN AUTHENTICATION (Password: abirta009)
// -------------------------------------------------------------
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    res.status(400).json({ success: false, message: 'এডমিন পাসওয়ার্ড প্রদান করুন।' });
    return;
  }

  if (password.trim() === ADMIN_PASSCODE) {
    res.json({
      success: true,
      message: 'Admin Authentication Successful!',
      role: 'SUPER_ADMIN',
      serverTime: Date.now(),
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'ভুল Admin পাসওয়ার্ড! সঠিক পাসওয়ার্ড প্রবেশ করান।',
    });
  }
});

// -------------------------------------------------------------
// DATABASE ADMIN PANEL & KEY GENERATOR API (FIREBASE RTDB DIRECT SYNC)
// -------------------------------------------------------------

// 1. Fetch all keys from Firebase RTDB with normalized data
app.get('/api/admin/keys', async (_req: Request, res: Response) => {
  try {
    const upstreamUrl = `${FIREBASE_RTDB_URL}/keys.json`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!upstreamRes.ok) {
      throw new Error(`Firebase RTDB responded with status ${upstreamRes.status}`);
    }

    const rawObj: Record<string, any> = (await upstreamRes.json()) || {};
    const normalizedKeys = Object.entries(rawObj).map(([keyName, val]) => {
      let active = true;
      let status: 'active' | 'inactive' | 'expired' = 'active';
      let plan = 'PAID VIP';
      let createdAt: number = Date.now();
      let expiresAt: number | null = null;
      let durationText = 'Standard VIP';
      let note = '';
      let isLifetime = false;

      if (val === true) {
        status = 'active';
        plan = 'VIP ACCESS';
        isLifetime = true;
        durationText = 'Lifetime Access';
      } else if (typeof val === 'object' && val !== null) {
        plan = val.plan || val.type || 'PAID VIP';
        note = val.note || '';

        if (val.active === false || String(val.status).toLowerCase() === 'inactive' || String(val.status).toLowerCase() === 'banned') {
          active = false;
          status = 'inactive';
        }

        if (val.lifetime || val.isLifetime) {
          isLifetime = true;
          durationText = 'Lifetime Access';
        }

        if (val.createdAt && typeof val.createdAt === 'number') {
          createdAt = val.createdAt;
        } else if (val.timestamp && typeof val.timestamp === 'number') {
          createdAt = val.timestamp;
        } else if (val.created_at) {
          createdAt = new Date(val.created_at).getTime() || Date.now();
        }

        expiresAt = val.expiresAt || val.expires || val.expiry || null;

        if (!expiresAt && val.duration_hours) {
          expiresAt = createdAt + Number(val.duration_hours) * 3600 * 1000;
          durationText = `${val.duration_hours}h Access`;
        } else if (!expiresAt && val.durationDays) {
          expiresAt = createdAt + Number(val.durationDays) * 86400 * 1000;
          durationText = `${val.durationDays}d VIP`;
        } else if (val.days) {
          expiresAt = createdAt + Number(val.days) * 86400 * 1000;
          durationText = `${val.days}d VIP`;
        }

        if (expiresAt && typeof expiresAt === 'number') {
          if (expiresAt < Date.now()) {
            status = 'expired';
            active = false;
          }
        }
      }

      let expiryText = 'Active VIP';
      if (isLifetime) {
        expiryText = 'Lifetime (No Expiry)';
      } else if (expiresAt && typeof expiresAt === 'number') {
        expiryText = formatRemainingTime(expiresAt);
      } else if (durationText) {
        expiryText = durationText;
      }

      return {
        key: keyName,
        active,
        status,
        plan,
        createdAt,
        expiresAt,
        expiryText,
        durationText,
        note,
        isLifetime,
        rawData: val,
      };
    });

    // Sort: newest first
    normalizedKeys.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

    res.json({
      success: true,
      firebaseUrl: FIREBASE_RTDB_URL,
      totalCount: normalizedKeys.length,
      activeCount: normalizedKeys.filter((k) => k.status === 'active').length,
      expiredCount: normalizedKeys.filter((k) => k.status === 'expired').length,
      inactiveCount: normalizedKeys.filter((k) => k.status === 'inactive').length,
      keys: normalizedKeys,
    });
  } catch (err: any) {
    console.error('[Admin Get Keys Error]:', err?.message || err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve keys from Firebase Realtime Database.',
      error: err?.message,
    });
  }
});

// 2. Generate and save new keys (Single or Bulk) with Full Cryptographic Encryption
app.post('/api/admin/keys', async (req: Request, res: Response) => {
  try {
    const {
      key: customKey,
      plan = 'VIP ACCESS',
      durationHours,
      durationDays,
      isLifetime,
      isEncrypted = true,
      note = '',
      prefix = 'ARX',
      count = 1,
    } = req.body;

    const totalCount = Math.max(1, Math.min(25, Number(count) || 1));
    const now = Date.now();
    let expiresAt: number | null = null;
    let durationText = 'Active VIP';
    let durationCode = '30D';

    if (isLifetime) {
      expiresAt = null;
      durationText = 'Lifetime Access';
      durationCode = 'LIFE';
    } else if (durationHours && Number(durationHours) > 0) {
      expiresAt = now + Number(durationHours) * 3600 * 1000;
      durationText = `${durationHours} Hours`;
      durationCode = `${durationHours}H`;
    } else if (durationDays && Number(durationDays) > 0) {
      expiresAt = now + Number(durationDays) * 86400 * 1000;
      durationText = `${durationDays} Days`;
      durationCode = `${durationDays}D`;
    } else {
      // Default 30 days
      expiresAt = now + 30 * 86400 * 1000;
      durationText = '30 Days';
      durationCode = '30D';
    }

    const cleanPrefix = (prefix || 'ARX').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const generatedList: any[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const makeChunk = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    for (let i = 0; i < totalCount; i++) {
      let finalKey: string;
      let signature: string | undefined;

      if (customKey && totalCount === 1) {
        finalKey = customKey.trim().toUpperCase();
      } else if (isEncrypted) {
        const cryptoResult = generateSecureEncryptedKey(cleanPrefix, durationCode, now + i, expiresAt);
        finalKey = cryptoResult.key;
        signature = cryptoResult.signature;
      } else {
        finalKey = `${cleanPrefix}-${makeChunk(4)}-${makeChunk(4)}-VIP`;
      }

      const keyPayload = {
        key: finalKey,
        active: true,
        status: 'active',
        plan,
        createdAt: now,
        expiresAt,
        durationDays: durationDays ? Number(durationDays) : null,
        duration_hours: durationHours ? Number(durationHours) : null,
        isLifetime: !!isLifetime,
        encryption: isEncrypted ? 'HMAC-SHA256' : 'Standard',
        signature: signature || null,
        note: note || `Created via Admin Panel on ${new Date().toLocaleDateString()}`,
        createdBy: 'admin-panel',
      };

      // Save directly to Firebase Realtime Database
      const targetUrl = `${FIREBASE_RTDB_URL}/keys/${encodeURIComponent(finalKey)}.json`;
      await fetch(targetUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyPayload),
      });

      generatedList.push({
        key: finalKey,
        data: keyPayload,
        expiryText: isLifetime ? 'Lifetime Access' : formatRemainingTime(expiresAt!),
      });
    }

    res.json({
      success: true,
      message: totalCount === 1
        ? `VIP Key '${generatedList[0].key}' successfully created with Full Encryption!`
        : `Successfully generated ${totalCount} encrypted VIP keys in Firebase!`,
      key: generatedList[0].key,
      keys: generatedList.map((g) => g.key),
      data: generatedList[0].data,
      allGenerated: generatedList,
      expiryText: isLifetime ? 'Lifetime Access' : formatRemainingTime(expiresAt!),
    });
  } catch (err: any) {
    console.error('[Admin Create Key Error]:', err?.message || err);
    res.status(500).json({
      success: false,
      message: 'Failed to create key in Firebase Realtime Database.',
      error: err?.message,
    });
  }
});

// 3. Update key status (toggle active/inactive or edit notes)
app.patch('/api/admin/keys/:key', async (req: Request, res: Response) => {
  try {
    const rawKey = req.params.key;
    const { active, status, note, addDays } = req.body;

    const updates: Record<string, any> = {};
    if (active !== undefined) {
      updates.active = Boolean(active);
      updates.status = updates.active ? 'active' : 'inactive';
    }
    if (status !== undefined) {
      updates.status = status;
      if (status === 'inactive' || status === 'banned') updates.active = false;
      if (status === 'active') updates.active = true;
    }
    if (note !== undefined) {
      updates.note = note;
    }
    if (addDays && Number(addDays) > 0) {
      updates.expiresAt = Date.now() + Number(addDays) * 86400 * 1000;
    }

    const targetUrl = `${FIREBASE_RTDB_URL}/keys/${encodeURIComponent(rawKey)}.json`;
    const fbRes = await fetch(targetUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!fbRes.ok) {
      throw new Error(`Firebase PATCH failed with status ${fbRes.status}`);
    }

    res.json({
      success: true,
      message: `Key '${rawKey}' updated successfully in Firebase.`,
      updates,
    });
  } catch (err: any) {
    console.error('[Admin Update Key Error]:', err?.message || err);
    res.status(500).json({
      success: false,
      message: 'Failed to update key in Firebase.',
      error: err?.message,
    });
  }
});

// 4. Delete key from Firebase RTDB
app.delete('/api/admin/keys/:key', async (req: Request, res: Response) => {
  try {
    const rawKey = req.params.key;
    const targetUrl = `${FIREBASE_RTDB_URL}/keys/${encodeURIComponent(rawKey)}.json`;
    const fbRes = await fetch(targetUrl, {
      method: 'DELETE',
    });

    if (!fbRes.ok) {
      throw new Error(`Firebase DELETE failed with status ${fbRes.status}`);
    }

    res.json({
      success: true,
      message: `Key '${rawKey}' permanently deleted from Firebase Database.`,
      deletedKey: rawKey,
    });
  } catch (err: any) {
    console.error('[Admin Delete Key Error]:', err?.message || err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete key from Firebase.',
      error: err?.message,
    });
  }
});

// 5. Firebase database configuration & connectivity check
app.get('/api/admin/firebase-config', async (_req: Request, res: Response) => {
  try {
    const pingStart = Date.now();
    const testRes = await fetch(`${FIREBASE_RTDB_URL}/keys.json?shallow=true`, {
      headers: { 'Accept': 'application/json' },
    });
    const pingTime = Date.now() - pingStart;

    const isConnected = testRes.ok;
    const keysCount = isConnected ? Object.keys((await testRes.json()) || {}).length : 0;

    res.json({
      success: true,
      connected: isConnected,
      url: FIREBASE_RTDB_URL,
      pingMs: pingTime,
      totalKeys: keysCount,
      databaseType: 'Firebase Realtime Database',
      mode: 'Live Cloud Sync',
    });
  } catch (err: any) {
    res.json({
      success: false,
      connected: false,
      url: FIREBASE_RTDB_URL,
      error: err?.message || 'Database unreachable',
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

// Standalone Admin Page route
app.get(['/admin', '/admin.html'], (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Game Iframe Proxy loader (bypasses X-Frame-Options iframes)
app.get('/api/proxy-frame', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    let validUrl = targetUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    const upstreamRes = await fetch(validUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const contentType = upstreamRes.headers.get('content-type') || 'text/html';
    res.setHeader('Content-Type', contentType);
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');

    const body = await upstreamRes.text();
    const urlObj = new URL(validUrl);
    const baseHref = `${urlObj.protocol}//${urlObj.host}/`;
    const modifiedBody = body.includes('<head>')
      ? body.replace('<head>', `<head><base href="${baseHref}">`)
      : `<base href="${baseHref}">${body}`;

    res.send(modifiedBody);
  } catch (err: any) {
    res.status(502).send(`Unable to load iframe proxy: ${err?.message || err}`);
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

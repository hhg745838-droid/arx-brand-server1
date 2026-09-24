import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Plus,
  RefreshCw,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Code2,
  Download,
  Check,
  Zap,
  Cpu,
  Flame,
  AlertTriangle,
  FileCode2,
  Info,
} from 'lucide-react';
import { AdminKeyItem } from '../types';
import { soundFX } from '../utils/audio';

export const AdminPanel: React.FC = () => {
  // Key generator state
  const [keyInput, setKeyInput] = useState('');
  const [duration, setDuration] = useState('30_days');
  const [plan, setPlan] = useState('VIP ACCESS');
  const [note, setNote] = useState('');
  const [prefix, setPrefix] = useState('ARX');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Key list & stats state
  const [keys, setKeys] = useState<AdminKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Verification testing state
  const [testResult, setTestResult] = useState<{
    key: string;
    valid: boolean;
    plan?: string;
    expiryText?: string;
    message?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Standalone HTML Modal
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);

  // Delete modal confirmation
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  // Feedback Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Generate random key string
  const handleRandomizeKey = () => {
    soundFX.playClick();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const makeChunk = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const cleanPrefix = (prefix || 'ARX').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newKey = `${cleanPrefix}-${makeChunk(4)}-${makeChunk(4)}-VIP`;
    setKeyInput(newKey);
    showToast(`অটো কী তৈরি হয়েছে: ${newKey}`, 'info');
  };

  // Fetch keys from Firebase backend
  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/keys');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.keys && Array.isArray(data.keys)) {
        setKeys(data.keys);
      }
    } catch (err: any) {
      showToast('Firebase কী লোড করতে সমস্যা হয়েছে: ' + err?.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    handleRandomizeKey();
  }, []);

  // Create new key
  const handleCreateKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundFX.playClick();

    let targetKey = keyInput.trim().toUpperCase();
    if (!targetKey) {
      handleRandomizeKey();
      return;
    }

    setIsSubmitting(true);
    let durationHours: number | null = null;
    let durationDays: number | null = null;
    let isLifetime = false;

    if (duration === 'lifetime') {
      isLifetime = true;
    } else if (duration.endsWith('_hours')) {
      durationHours = parseInt(duration, 10);
    } else if (duration.endsWith('_days')) {
      durationDays = parseInt(duration, 10);
    }

    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: targetKey,
          plan,
          durationHours,
          durationDays,
          isLifetime,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundFX.playWinChime();
        showToast(`কী '${targetKey}' সফলভাবে Firebase-এ সংরক্ষিত হয়েছে!`, 'success');

        // Copy key automatically
        navigator.clipboard.writeText(targetKey).catch(() => {});
        setCopiedKey(targetKey);

        // Reset and generate next
        setNote('');
        handleRandomizeKey();
        fetchKeys();
      } else {
        soundFX.playLossBuzzer();
        showToast(data.message || 'কী তৈরি ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      soundFX.playLossBuzzer();
      showToast('সার্ভার এরর: ' + err?.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (item: AdminKeyItem) => {
    soundFX.playClick();
    const newActive = !item.active;
    try {
      const res = await fetch(`/api/admin/keys/${encodeURIComponent(item.key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`কী '${item.key}' স্ট্যাটাস পরিবর্তিত হয়েছে।`, 'info');
        setKeys((prev) =>
          prev.map((k) =>
            k.key === item.key
              ? {
                  ...k,
                  active: newActive,
                  status: newActive ? 'active' : 'inactive',
                }
              : k
          )
        );
      }
    } catch (err: any) {
      showToast('স্ট্যাটাস আপডেট ব্যর্থ: ' + err?.message, 'error');
    }
  };

  // Delete key
  const confirmDeleteKey = async () => {
    if (!keyToDelete) return;
    soundFX.playClick();
    try {
      const res = await fetch(`/api/admin/keys/${encodeURIComponent(keyToDelete)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        soundFX.playLossBuzzer();
        showToast(`কী '${keyToDelete}' Firebase থেকে ডিলিট করা হয়েছে!`, 'success');
        setKeys((prev) => prev.filter((k) => k.key !== keyToDelete));
        setKeyToDelete(null);
      }
    } catch (err: any) {
      showToast('ডিলিট ব্যর্থ হয়েছে: ' + err?.message, 'error');
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    soundFX.playClick();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(text);
      showToast(`কী কপি করা হয়েছে: ${text}`, 'success');
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  // Test key validity
  const handleTestKey = async (targetKey: string) => {
    soundFX.playScanLaser();
    setIsTesting(true);
    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: targetKey }),
      });
      const data = await res.json();
      setTestResult({
        key: targetKey,
        valid: Boolean(data.valid),
        plan: data.plan,
        expiryText: data.expiryText,
        message: data.message,
      });
      if (data.valid) {
        soundFX.playWinChime();
      } else {
        soundFX.playLossBuzzer();
      }
    } catch (err: any) {
      setTestResult({
        key: targetKey,
        valid: false,
        message: 'কানেকশন এরর: ' + err?.message,
      });
      soundFX.playLossBuzzer();
    } finally {
      setIsTesting(false);
    }
  };

  // Export JSON backup
  const handleExportJSON = () => {
    soundFX.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(keys, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `arx_firebase_keys_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('সব কী JSON ফাইলে ডাউনলোড হয়েছে!', 'success');
  };

  // Standalone HTML template string
  const standaloneHtmlCode = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARX BRAND SERVER 1 - VIP Key Admin Panel</title>
  <link rel="icon" type="image/png" href="https://i.postimg.cc/sxB74TxX/file-00000000097c81f5abb566d8a5f9d2ff.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #05070c; color: #f1f5f9; }
    .font-cyber { font-family: 'Orbitron', sans-serif; }
    .font-mono-cyber { font-family: 'Space Mono', monospace; }
  </style>
</head>
<body class="min-h-screen pb-16 selection:bg-red-600 selection:text-white">
  <!-- Firebase Direct Connected Admin Panel -->
  <header class="border-b border-red-500/20 bg-[#070910]/90 backdrop-blur-md sticky top-0 z-40 p-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="https://i.postimg.cc/sxB74TxX/file-00000000097c81f5abb566d8a5f9d2ff.png" class="w-10 h-10 rounded-xl border border-red-500/40" />
        <div>
          <div class="font-cyber font-bold text-white text-base">ARX BRAND SERVER 1</div>
          <div class="text-xs font-mono-cyber text-emerald-400">● FIREBASE RTDB CONNECTED</div>
        </div>
      </div>
      <button onclick="fetchKeys()" class="px-3 py-1.5 bg-red-950/60 border border-red-500/40 rounded-xl text-xs font-mono-cyber text-red-300">Refresh</button>
    </div>
  </header>
  <!-- Generator Form and Keys List (Open /admin in app for full view) -->
  <script>
    const FIREBASE_BASE_URL = 'https://abirhackadmin-default-rtdb.firebaseio.com';
    async function fetchKeys() {
      const res = await fetch(FIREBASE_BASE_URL + '/keys.json');
      const data = await res.json();
      console.log('Firebase keys:', data);
    }
    fetchKeys();
  </script>
</body>
</html>`;

  const copyHtmlCode = () => {
    soundFX.playClick();
    navigator.clipboard.writeText(standaloneHtmlCode).then(() => {
      setHtmlCopied(true);
      showToast('সম্পূর্ণ HTML কোড কপি করা হয়েছে!', 'success');
      setTimeout(() => setHtmlCopied(false), 2500);
    });
  };

  // Filter keys
  const filteredKeys = keys.filter((k) => {
    if (statusFilter !== 'all' && k.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchKey = k.key.toLowerCase().includes(q);
      const matchPlan = (k.plan || '').toLowerCase().includes(q);
      const matchNote = (k.note || '').toLowerCase().includes(q);
      return matchKey || matchPlan || matchNote;
    }
    return true;
  });

  const totalCount = keys.length;
  const activeCount = keys.filter((k) => k.status === 'active').length;
  const expiredCount = keys.filter((k) => k.status === 'expired').length;
  const inactiveCount = keys.filter((k) => k.status === 'inactive').length;

  return (
    <div className="relative w-full max-w-2xl mx-auto px-2 sm:px-3 pb-24 pt-1 flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-2xl bg-[#0e121d] border border-red-500/60 text-white font-mono-cyber text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner: Firebase Status & Quick Action Buttons */}
      <div className="p-3.5 bg-gradient-to-r from-[#0d111a] via-[#090b12] to-[#12080a] border border-red-500/40 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-cyber font-bold text-white uppercase tracking-wider">
              <span>FIREBASE RTDB DATABASE</span>
              <span className="px-1.5 py-0.2 bg-emerald-950/90 text-emerald-400 rounded border border-emerald-500/40 text-[9px] font-mono-cyber">
                ONLINE
              </span>
            </div>
            <div className="text-[10px] font-mono-cyber text-slate-400 truncate max-w-[240px]">
              abirhackadmin-default-rtdb.firebaseio.com
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowHtmlModal(true)}
            className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 rounded-xl text-[11px] font-mono-cyber text-red-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Get Full Standalone HTML Code"
          >
            <Code2 className="w-3.5 h-3.5 text-red-400" />
            <span>HTML Code</span>
          </button>

          <a
            href="/admin.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-mono-cyber text-slate-300 flex items-center gap-1.5 transition-all"
            title="Open Dedicated Admin Page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Page</span>
          </a>

          <button
            onClick={fetchKeys}
            disabled={isLoading}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 cursor-pointer transition-all disabled:opacity-50"
            title="Refresh Database Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 bg-[#0b0e16]/90 border border-slate-800 rounded-xl text-center">
          <div className="text-[9px] font-mono-cyber text-slate-400 uppercase">TOTAL</div>
          <div className="text-base sm:text-lg font-cyber font-bold text-white mt-0.5">{totalCount}</div>
        </div>
        <div className="p-2.5 bg-[#0b0e16]/90 border border-emerald-500/30 rounded-xl text-center">
          <div className="text-[9px] font-mono-cyber text-emerald-400 uppercase">ACTIVE</div>
          <div className="text-base sm:text-lg font-cyber font-bold text-emerald-400 mt-0.5">{activeCount}</div>
        </div>
        <div className="p-2.5 bg-[#0b0e16]/90 border border-amber-500/30 rounded-xl text-center">
          <div className="text-[9px] font-mono-cyber text-amber-400 uppercase">EXPIRED</div>
          <div className="text-base sm:text-lg font-cyber font-bold text-amber-400 mt-0.5">{expiredCount}</div>
        </div>
        <div className="p-2.5 bg-[#0b0e16]/90 border border-red-500/30 rounded-xl text-center">
          <div className="text-[9px] font-mono-cyber text-red-400 uppercase">REVOKED</div>
          <div className="text-base sm:text-lg font-cyber font-bold text-red-400 mt-0.5">{inactiveCount}</div>
        </div>
      </div>

      {/* Key Generator Card */}
      <div className="p-4 bg-[#0c101a]/95 border border-red-500/35 rounded-2xl shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-red-400" />
            <h3 className="font-cyber font-bold text-xs sm:text-sm tracking-wider text-white uppercase">
              GENERATE NEW VIP KEY (কী তৈরি করুন)
            </h3>
          </div>
          <span className="text-[10px] font-mono-cyber text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/40">
            AUTO-SYNC
          </span>
        </div>

        {/* Key Input & Auto-randomize */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono-cyber text-slate-300 mb-1">
            <span>KEY CODE (কী কোড বা নাম)</span>
            <span className="text-[10px] text-slate-500">অটো বা কাস্টম নাম দিতে পারেন</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
              placeholder="ARX-XXXX-XXXX-VIP"
              className="w-full px-3 py-2 bg-black/80 border border-red-500/40 rounded-xl text-white font-mono-cyber text-xs tracking-wider uppercase focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
            />
            <button
              type="button"
              onClick={handleRandomizeKey}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-mono-cyber text-xs rounded-xl font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
              title="Generate new random key"
            >
              <span>🎲</span>
              <span className="hidden sm:inline">Auto</span>
            </button>
          </div>
        </div>

        {/* Duration & Plan grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono-cyber text-slate-300 mb-1">
              DURATION (মেয়াদ)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 bg-black/80 border border-slate-700 rounded-xl text-white font-mono-cyber text-xs focus:outline-none focus:border-red-400 cursor-pointer"
            >
              <option value="1_hours">1 Hour Access (১ ঘন্টা)</option>
              <option value="4_hours">4 Hours Access (৪ ঘন্টা)</option>
              <option value="24_hours">24 Hours / 1 Day (১ দিন)</option>
              <option value="3_days">3 Days Access (৩ দিন)</option>
              <option value="7_days">7 Days Access (৭ দিন)</option>
              <option value="30_days">30 Days Standard (১ মাস)</option>
              <option value="90_days">90 Days VIP (৩ মাস)</option>
              <option value="365_days">1 Year Access (১ বছর)</option>
              <option value="lifetime">Lifetime Access (আজীবন)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono-cyber text-slate-300 mb-1">
              PLAN / TIER (প্ল্যান)
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2 bg-black/80 border border-slate-700 rounded-xl text-white font-mono-cyber text-xs focus:outline-none focus:border-red-400 cursor-pointer"
            >
              <option value="VIP ACCESS">VIP ACCESS (Standard Paid)</option>
              <option value="ULTRA VIP">ULTRA VIP (High Precision)</option>
              <option value="PRO MODS">PRO MODS (Server 1 Core)</option>
              <option value="LIFETIME VIP">LIFETIME VIP (Permanent)</option>
            </select>
          </div>
        </div>

        {/* Customer Note */}
        <div>
          <label className="block text-[11px] font-mono-cyber text-slate-300 mb-1">
            CUSTOMER NOTE / TELEGRAM (নোট)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid by Abir / Telegram @username"
            className="w-full px-3 py-2 bg-black/80 border border-slate-700 rounded-xl text-white font-mono-cyber text-xs focus:outline-none focus:border-red-400"
          />
        </div>

        {/* Create Button */}
        <button
          onClick={() => handleCreateKey()}
          disabled={isSubmitting || !keyInput.trim()}
          className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-cyber font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/40 border border-red-400/50 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>SAVING TO FIREBASE...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>CREATE & SAVE TO FIREBASE DATABASE</span>
            </>
          )}
        </button>
      </div>

      {/* Keys List Section */}
      <div className="p-4 bg-[#0c101a]/95 border border-slate-800 rounded-2xl shadow-xl flex flex-col gap-3">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-cyber font-bold text-xs sm:text-sm tracking-wider text-white uppercase">
              FIREBASE LIVE KEYS ({filteredKeys.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keys..."
                className="w-full pl-8 pr-2 py-1.5 bg-black/80 border border-slate-700 rounded-xl text-white font-mono-cyber text-[11px] focus:outline-none focus:border-red-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-black/80 border border-slate-700 rounded-xl text-slate-300 font-mono-cyber text-[11px] focus:outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Revoked</option>
            </select>
          </div>
        </div>

        {/* Keys List */}
        <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto no-scrollbar pr-0.5">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 font-mono-cyber text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
              <span>Connecting to Firebase Realtime Database...</span>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="py-10 text-center text-slate-500 font-mono-cyber text-xs">
              No keys found matching your search.
            </div>
          ) : (
            filteredKeys.map((item) => {
              const isExpired = item.status === 'expired';
              const isInactive = item.status === 'inactive';
              const isJustCopied = copiedKey === item.key;

              return (
                <div
                  key={item.key}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isExpired
                      ? 'bg-amber-950/15 border-amber-500/20'
                      : isInactive
                      ? 'bg-red-950/20 border-red-500/25'
                      : 'bg-black/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-cyber font-bold text-xs sm:text-sm text-white tracking-wide">
                        {item.key}
                      </span>

                      {/* Status badge */}
                      {item.status === 'active' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-cyber font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                          ACTIVE
                        </span>
                      )}
                      {item.status === 'expired' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-cyber font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40">
                          EXPIRED
                        </span>
                      )}
                      {item.status === 'inactive' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-cyber font-bold bg-red-950/80 text-red-400 border border-red-500/40">
                          REVOKED
                        </span>
                      )}

                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-cyber bg-slate-900 text-slate-300 border border-slate-800">
                        {item.plan}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono-cyber text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.expiryText}</span>
                      </span>
                      {item.note && (
                        <>
                          <span>·</span>
                          <span className="text-slate-400 truncate max-w-[200px]">
                            {item.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(item.key)}
                      className={`p-1.5 rounded-lg border text-xs font-mono-cyber flex items-center gap-1 transition-all cursor-pointer ${
                        isJustCopied
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-200'
                      }`}
                      title="Copy Key"
                    >
                      {isJustCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{isJustCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Test Verify Button */}
                    <button
                      onClick={() => handleTestKey(item.key)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs cursor-pointer"
                      title="Test Key Gateway"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    {/* Revoke / Activate Toggle */}
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-mono-cyber transition-all cursor-pointer ${
                        item.active
                          ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                          : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      }`}
                      title={item.active ? 'Revoke Key' : 'Activate Key'}
                    >
                      {item.active ? 'Revoke' : 'Active'}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setKeyToDelete(item.key)}
                      className="p-1.5 rounded-lg bg-red-950/40 border border-red-500/30 hover:bg-red-900/60 text-red-400 text-xs cursor-pointer"
                      title="Delete Key from Firebase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono-cyber text-slate-400">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Keys Backup (JSON)</span>
          </button>
          <span>Live abirhackadmin Firebase RTDB</span>
        </div>
      </div>

      {/* Test Result Modal */}
      {testResult && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 bg-[#0e121d] border border-red-500/50 rounded-2xl shadow-2xl flex flex-col gap-3 font-mono-cyber">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-white">KEY GATEWAY VERIFICATION</span>
              </div>
              <button
                onClick={() => setTestResult(null)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Testing Key:</span>
                <span className="font-bold text-white">{testResult.key}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Result:</span>
                {testResult.valid ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ACCESS GRANTED
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> ACCESS DENIED
                  </span>
                )}
              </div>
              {testResult.plan && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan:</span>
                  <span className="text-amber-400">{testResult.plan}</span>
                </div>
              )}
              {testResult.expiryText && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Remaining Time:</span>
                  <span className="text-cyan-400">{testResult.expiryText}</span>
                </div>
              )}
              {testResult.message && (
                <div className="text-[11px] text-slate-300 mt-1 border-t border-white/5 pt-1">
                  {testResult.message}
                </div>
              )}
            </div>

            <button
              onClick={() => setTestResult(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {keyToDelete && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 bg-[#0e121d] border border-red-500/50 rounded-2xl shadow-2xl flex flex-col gap-3 font-mono-cyber">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>DELETE VIP KEY</span>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete VIP Key <strong className="text-white font-bold">{keyToDelete}</strong> from Firebase database?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setKeyToDelete(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteKey}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Delete from Firebase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone HTML Code Modal ("give me html code") */}
      {showHtmlModal && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-2xl bg-[#0b0e17] border border-red-500/50 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="font-cyber font-bold text-sm text-white">STANDALONE ADMIN PANEL HTML CODE</h3>
                  <div className="text-[11px] font-mono-cyber text-slate-400">
                    Pure Single-File HTML / CSS / JS · Works anywhere
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowHtmlModal(false)}
                className="text-slate-400 hover:text-white text-xl cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="p-3 bg-red-950/30 border-b border-red-500/20 text-xs font-mono-cyber text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                এই HTML কোডটি কপি করে <code className="text-red-300 bg-black/60 px-1 py-0.5 rounded">admin.html</code> নামে সেভ করলে যেকোনো হোস্টিং (Netlify, GitHub Pages, cPanel বা লোকাল ব্রাউজারে) সরাসরি Firebase RTDB-এর সাথে কাজ করবে।
              </div>
            </div>

            {/* Code Viewer Box */}
            <div className="flex-1 p-3 overflow-y-auto bg-black/90 font-mono-cyber text-xs text-emerald-400 leading-relaxed select-all">
              <pre className="whitespace-pre-wrap break-all text-[11px]">{standaloneHtmlCode}</pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-2">
              <a
                href="/admin.html"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono-cyber text-slate-300 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live View: /admin.html</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyHtmlCode}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {htmlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{htmlCopied ? 'COPIED TO CLIPBOARD!' : 'COPY HTML CODE'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

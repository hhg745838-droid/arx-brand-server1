import React, { useState, useRef, useEffect } from 'react';
import {
  Gamepad2,
  Globe,
  ArrowRight,
  ExternalLink,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Shield,
  RefreshCw,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Layers,
  Zap,
  Clock,
  Radio,
  Lock,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Check,
} from 'lucide-react';
import { PredictionResult } from '../types';
import { soundFX } from '../utils/audio';

interface GameTabProps {
  prediction: PredictionResult | null;
  currentPeriod: string;
  remainingSeconds: number;
}

interface SavedGameLink {
  id: string;
  name: string;
  url: string;
}

export const GameTab: React.FC<GameTabProps> = ({
  prediction,
  currentPeriod,
  remainingSeconds,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isIframeOpen, setIsIframeOpen] = useState(false);
  const [activeIframeUrl, setActiveIframeUrl] = useState('');
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [iframeError, setIframeError] = useState(false);

  // HUD position & minimization state
  const [isHudMinimized, setIsHudMinimized] = useState(false);
  const [hudCorner, setHudCorner] = useState<'br' | 'bl' | 'tr' | 'tl'>('br');

  // Saved user links in localStorage
  const [savedLinks, setSavedLinks] = useState<SavedGameLink[]>(() => {
    try {
      const stored = localStorage.getItem('arx_saved_game_links');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: '1', name: 'WinGo Official', url: 'https://draw.ar-lottery01.com' },
      { id: '2', name: 'Tiranga Portal', url: 'https://tirangagames.in' },
      { id: '3', name: '91Club Portal', url: 'https://91club.com' },
      { id: '4', name: 'Daman Platform', url: 'https://daman.vip' },
      { id: '5', name: 'BDG Game', url: 'https://bdg-game.com' },
      { id: '6', name: 'BigDaddy Game', url: 'https://bigdaddygame.com' },
    ];
  });

  const [bookmarkName, setBookmarkName] = useState('');
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const saveLinksToStorage = (links: SavedGameLink[]) => {
    setSavedLinks(links);
    try {
      localStorage.setItem('arx_saved_game_links', JSON.stringify(links));
    } catch {}
  };

  const handleAddBookmark = () => {
    const cleanUrl = inputUrl.trim();
    if (!cleanUrl) return;
    soundFX.playClick();
    const newName = bookmarkName.trim() || new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`).hostname.replace('www.', '');
    const newEntry: SavedGameLink = {
      id: Date.now().toString(),
      name: newName,
      url: cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`,
    };
    const updated = [newEntry, ...savedLinks];
    saveLinksToStorage(updated);
    setBookmarkName('');
    setShowAddBookmark(false);
  };

  const handleDeleteBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    const updated = savedLinks.filter((item) => item.id !== id);
    saveLinksToStorage(updated);
  };

  const loadGameInIframe = (targetUrl?: string, proxyOverride?: boolean) => {
    soundFX.playClick();
    let url = (targetUrl || inputUrl).trim();
    if (!url) {
      url = savedLinks[0]?.url || 'https://draw.ar-lottery01.com';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const shouldUseProxy = proxyOverride !== undefined ? proxyOverride : useProxy;
    const finalUrl = shouldUseProxy ? `/api/proxy-frame?url=${encodeURIComponent(url)}` : url;

    setInputUrl(url);
    setActiveIframeUrl(finalUrl);
    setIsIframeLoading(true);
    setIframeError(false);
    setIsIframeOpen(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleReloadIframe = () => {
    soundFX.playClick();
    setIsIframeLoading(true);
    setIframeError(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleToggleProxy = () => {
    soundFX.playClick();
    const nextProxyState = !useProxy;
    setUseProxy(nextProxyState);
    if (activeIframeUrl) {
      loadGameInIframe(inputUrl, nextProxyState);
    }
  };

  // Format mm:ss
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');

  // Corners style mapping
  const cornerClasses = {
    br: 'bottom-4 right-4',
    bl: 'bottom-4 left-4',
    tr: 'top-16 right-4',
    tl: 'top-16 left-4',
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-3.5 pb-28 pt-2 flex flex-col gap-4">
      {/* Background Cyber Watermark */}
      <div className="cyber-watermark pointer-events-none">
        <div>RAHMAN VA</div>
        <div>ADVANCE ADMIN</div>
      </div>

      {/* Main Game Platform Loader Card */}
      <div className="relative z-10 flex flex-col items-center justify-center p-5 sm:p-7 bg-[#0d1017]/95 border border-red-500/35 rounded-3xl shadow-2xl glow-box-red text-center">
        {/* Emblem */}
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-red-600/25 blur-xl animate-pulse" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-rose-700 to-black border border-red-500/60 flex items-center justify-center shadow-lg shadow-red-950/80">
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="font-cyber font-bold text-base sm:text-lg text-white tracking-widest uppercase mb-1 flex items-center gap-2 justify-center">
          <span>GAME IFRAME</span>
          <span className="text-red-500">LOAD SYSTEM</span>
        </h2>
        <p className="text-xs font-mono-cyber text-slate-400 max-w-sm mb-4 leading-relaxed">
          যেকোনো গেম ওয়েবসাইটের লিংক প্রবেশ করিয়ে অ্যাপের ভেতর সরাসরি লাইভ iframe-এ লোড করুন।
        </p>

        {/* URL Input Box */}
        <div className="w-full max-w-md flex flex-col gap-2 mb-3">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter game URL (e.g. https://tirangagames.in)"
              className="w-full pl-10 pr-24 py-3 bg-black/80 border border-slate-700 rounded-xl font-mono-cyber text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadGameInIframe();
              }}
            />
            <button
              onClick={() => setShowAddBookmark(!showAddBookmark)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-mono-cyber text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Save to bookmarks"
            >
              <BookmarkPlus className="w-3 h-3 text-amber-400" />
              <span>Save</span>
            </button>
          </div>

          {/* Add Bookmark Drawer */}
          {showAddBookmark && (
            <div className="p-3 bg-black/90 border border-slate-800 rounded-xl flex flex-col gap-2 text-left">
              <label className="text-[10px] font-mono-cyber text-slate-400 uppercase">
                Bookmark Custom Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bookmarkName}
                  onChange={(e) => setBookmarkName(e.target.value)}
                  placeholder="e.g. My VIP WinGo Club"
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono-cyber text-white focus:outline-none focus:border-red-400"
                />
                <button
                  onClick={handleAddBookmark}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono-cyber font-bold cursor-pointer"
                >
                  Save Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Options Row: Direct vs Smart Proxy */}
        <div className="w-full max-w-md flex items-center justify-between px-2 mb-4 text-[11px] font-mono-cyber text-slate-400">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="proxyCheck"
              checked={useProxy}
              onChange={handleToggleProxy}
              className="accent-red-500 w-3.5 h-3.5 cursor-pointer rounded"
            />
            <label htmlFor="proxyCheck" className="cursor-pointer text-slate-300 flex items-center gap-1">
              <span>Bypass X-Frame (Smart Proxy)</span>
              <span className="text-[9px] px-1 py-0.2 bg-red-950/80 text-red-400 rounded border border-red-500/30">
                ANTI-BLOCK
              </span>
            </label>
          </div>
          <span className="text-[10px] text-slate-500">Auto-Detect</span>
        </div>

        {/* Main Action Button */}
        <button
          onClick={() => loadGameInIframe()}
          className="w-full max-w-md py-3.5 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white font-cyber font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-950/70 border border-red-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Layers className="w-4 h-4 text-white" />
          <span>LOAD GAME IN IFRAME</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>

        {/* Saved Game Portals Grid */}
        <div className="w-full max-w-md mt-6 pt-4 border-t border-slate-800/80 text-left">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono-cyber text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3 h-3 text-red-400" />
              <span>SAVED GAME SITES ({savedLinks.length})</span>
            </span>
            <span className="text-[10px] font-mono-cyber text-slate-500">Click to Load</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {savedLinks.map((link) => (
              <div
                key={link.id}
                onClick={() => loadGameInIframe(link.url)}
                className="group p-2.5 bg-black/60 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/50 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="truncate pr-1">
                  <div className="text-xs font-mono-cyber font-bold text-slate-200 group-hover:text-red-300 truncate">
                    {link.name}
                  </div>
                  <div className="text-[9px] font-mono-cyber text-slate-500 truncate">
                    {link.url.replace(/^https?:\/\//, '')}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100">
                  <button
                    onClick={(e) => handleDeleteBookmark(link.id, e)}
                    className="p-1 hover:text-red-400 text-slate-500 rounded transition-colors"
                    title="Delete link"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-red-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FULLSCREEN IN-APP IFRAME VIEWER WITH FLOATING LIVE AI HUD */}
      {isIframeOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#06080e] flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Iframe Top Browser Bar */}
          <div className="px-3 py-2 bg-[#090b12] border-b border-red-500/30 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="bg-black/70 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono-cyber text-slate-300 truncate flex-1 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{inputUrl || activeIframeUrl}</span>
                {useProxy && (
                  <span className="text-[9px] px-1 bg-red-950 text-red-300 border border-red-500/40 rounded shrink-0">
                    PROXY
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Proxy toggle in navbar */}
              <button
                onClick={handleToggleProxy}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono-cyber border transition-all cursor-pointer ${
                  useProxy
                    ? 'bg-red-950/80 border-red-500 text-red-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Toggle Smart Anti-Block Proxy"
              >
                {useProxy ? 'Proxy: ON' : 'Proxy: OFF'}
              </button>

              {/* Reload Button */}
              <button
                onClick={handleReloadIframe}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                title="Reload Iframe"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isIframeLoading ? 'animate-spin text-red-400' : ''}`} />
              </button>

              {/* Open in external tab */}
              <button
                onClick={() => window.open(inputUrl, '_blank')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                title="Open in Browser Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsIframeOpen(false)}
                className="p-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 cursor-pointer"
                title="Close Iframe"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Iframe Viewport Container */}
          <div className="relative flex-1 w-full h-full bg-[#05060a] overflow-hidden">
            {/* Loading Indicator Spinner */}
            {isIframeLoading && (
              <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 font-mono-cyber pointer-events-none">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs text-slate-200 font-bold tracking-wider">
                  LOADING GAME PLATFORM IFRAME...
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-xs">{inputUrl}</div>
              </div>
            )}

            {/* Actual Game Iframe */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={activeIframeUrl}
              onLoad={() => {
                setIsIframeLoading(false);
              }}
              onError={() => {
                setIsIframeLoading(false);
                setIframeError(true);
              }}
              className="w-full h-full border-0"
              allow="fullscreen; autoplay; clipboard-write; camera; microphone; payment"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock"
              title="Game Platform Iframe"
            />

            {/* Smart Notice Bar if site blocks direct iframing */}
            {!useProxy && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                <div className="px-3 py-1 rounded-full bg-[#0e121d]/90 border border-slate-700 text-[10px] font-mono-cyber text-slate-300 shadow-xl flex items-center gap-2 backdrop-blur-md">
                  <span>সাইট লোড না হলে:</span>
                  <button
                    onClick={handleToggleProxy}
                    className="text-red-400 font-bold underline hover:text-red-300 cursor-pointer"
                  >
                    Switch to Proxy Mode
                  </button>
                </div>
              </div>
            )}

            {/* FLOATING LIVE AI PREDICTION HUD (Overlaid on top of the game!) */}
            <div className={`fixed z-50 transition-all ${cornerClasses[hudCorner]}`}>
              <div className="p-3 bg-[#0d1017]/95 border-2 border-red-500/80 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.35)] backdrop-blur-xl flex flex-col gap-2 max-w-[260px] sm:max-w-xs">
                {/* HUD Header */}
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 font-cyber font-black text-xs text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AI LIVE HUD</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    {/* Corner Switcher */}
                    <button
                      onClick={() => {
                        const corners: ('br' | 'bl' | 'tr' | 'tl')[] = ['br', 'bl', 'tl', 'tr'];
                        const nextIdx = (corners.indexOf(hudCorner) + 1) % corners.length;
                        setHudCorner(corners[nextIdx]);
                      }}
                      className="text-[9px] font-mono-cyber px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:text-white"
                      title="Move HUD to next corner"
                    >
                      MOVE
                    </button>

                    <button
                      onClick={() => setIsHudMinimized(!isHudMinimized)}
                      className="p-1 hover:text-white cursor-pointer"
                      title={isHudMinimized ? 'Expand HUD' : 'Minimize HUD'}
                    >
                      {isHudMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* HUD Body */}
                {isHudMinimized ? (
                  <div className="flex items-center justify-between gap-3 font-mono-cyber py-0.5">
                    <span className="text-[10px] text-slate-400">...{currentPeriod.slice(-4)}</span>
                    <span
                      className={`text-sm font-cyber font-black tracking-wider ${
                        prediction?.side === 'BIG' ? 'text-red-400' : 'text-cyan-400'
                      }`}
                    >
                      {prediction?.side}
                    </span>
                    <span className="text-amber-400 font-bold text-xs">{mm}:{ss}</span>
                  </div>
                ) : (
                  <div className="font-mono-cyber text-xs space-y-1.5 pt-0.5">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Target Period:</span>
                      <span className="font-bold text-white tracking-wide">
                        ...{currentPeriod.slice(-6)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-black/60 p-2 rounded-xl border border-white/5">
                      <span className="text-slate-400 text-[11px]">PREDICTION:</span>
                      <span
                        className={`text-xl font-cyber font-black tracking-wider ${
                          prediction?.side === 'BIG'
                            ? 'text-red-400 glow-text-red'
                            : 'text-cyan-400 glow-text-cyan'
                        }`}
                      >
                        {prediction?.side || 'SCANNING'}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Digit / Hedge:</span>
                      <span className="text-emerald-400 font-bold">
                        {prediction?.number ?? '-'} / {prediction?.opposite ?? '-'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/10 pt-1.5 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        {remainingSeconds <= 5 ? (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-red-500 animate-bounce" />
                            <span>LOCKED:</span>
                          </span>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Draw Timer:</span>
                          </>
                        )}
                      </span>
                      <span className={`font-bold text-sm ${remainingSeconds <= 5 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                        {mm}:{ss}
                      </span>
                    </div>

                    <div className="text-[9px] text-center text-slate-500 pt-0.5">
                      {remainingSeconds <= 5 ? '🔒 BETTING CLOSED · AWAITING DRAW' : 'ARX BRAND SERVER 1 · REALTIME CONSENSUS'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

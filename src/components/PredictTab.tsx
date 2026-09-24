import React, { useState, useEffect } from 'react';
import { ServerType, PredictionResult, DrawItem, GameMode, BRAND_MOD_NAME, APP_LOGO, TELEGRAM_CHANNEL_URL, DEVELOPER_TELEGRAM_URL, MAIN_HEADER_NAME } from '../types';
import { RotateCw, Send, ShieldAlert } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface PredictTabProps {
  currentServer: ServerType;
  onChangeServer: (server: ServerType) => void;
  gameMode: GameMode;
  onChangeGameMode: (mode: GameMode) => void;
  prediction: PredictionResult | null;
  history: DrawItem[];
  remainingSeconds: number;
  isScanning: boolean;
  onRefreshManual: () => void;
  currentPeriod: string;
  latencyMs?: number;
  stats: {
    total: number;
    wins: number;
    winRate: number;
  };
}

export const PredictTab: React.FC<PredictTabProps> = ({
  currentServer,
  onChangeServer,
  gameMode,
  onChangeGameMode,
  prediction,
  history,
  remainingSeconds,
  isScanning,
  onRefreshManual,
  currentPeriod,
  latencyMs = 102,
  stats,
}) => {
  const [expiryTime, setExpiryTime] = useState({
    days: 29,
    hours: 22,
    minutes: 24,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setExpiryTime((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPeriodShort = (p?: string) => {
    if (!p) return '...0632';
    return p.length > 4 ? `...${p.slice(-4)}` : p;
  };

  // Format 8-digit period box (e.g., 00050632)
  const formatPeriodBox = (p?: string) => {
    if (!p) return '00050632';
    if (p.length >= 8) {
      return p.slice(-8);
    }
    return p.padStart(8, '0');
  };

  const isBig = prediction?.side === 'BIG';
  const confidenceValue = prediction?.accuracyPercent || 89;

  return (
    <div className="relative z-10 w-full max-w-md mx-auto px-3.5 pb-24 pt-3 flex flex-col gap-3 font-sans">
      {/* 1. Predict Engine Header + Period Box (ARX BRAND SERVER 1 UPDATE) */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-cyber font-black text-base sm:text-lg tracking-wider text-white">
              ARX BRAND
            </span>
            <span className="font-cyber font-black text-base sm:text-lg tracking-wider text-[#ff3344] glow-text-red">
              SERVER 1 UPDATE
            </span>
          </div>
          <div className="text-[11px] font-mono-cyber text-slate-400 mt-1">
            Next period prediction · AI Consensus
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[9px] font-mono-cyber uppercase tracking-widest text-slate-400 mb-1">
            PERIOD
          </span>
          <div className="px-3 py-1 bg-black/80 border border-white/20 rounded-xl font-mono-cyber font-bold text-sm tracking-widest text-white shadow-inner">
            {formatPeriodBox(currentPeriod)}
          </div>
          <span className="text-[10px] font-mono-cyber text-slate-400 mt-0.5">
            {latencyMs}ms
          </span>
        </div>
      </div>

      {/* Official Telegram & Developer Link Strip */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={TELEGRAM_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2.5 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono-cyber text-sky-300 font-bold transition-all shadow-sm"
        >
          <Send className="w-3 h-3 text-sky-400" />
          <span className="truncate">TELEGRAM CHANNEL</span>
        </a>
        <a
          href={DEVELOPER_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono-cyber text-emerald-300 font-bold transition-all shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate">DEV: @Owner_Not_perfect</span>
        </a>
      </div>

      {/* 2. Access Key Expiry Bar */}
      <div className="w-full px-3.5 py-2 bg-[#061710]/90 border border-emerald-500/40 rounded-full flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs">🔑</span>
          <span className="font-mono-cyber font-bold text-[11px] text-emerald-400 uppercase tracking-wider">
            ACCESS KEY EXPIRY
          </span>
        </div>
        <div className="font-mono-cyber font-bold text-xs text-emerald-400 tracking-wider">
          {expiryTime.days}d {expiryTime.hours}h {expiryTime.minutes}m {expiryTime.seconds}s
        </div>
      </div>

      {/* 3. Server Switcher with ARX BRAND SERVER 1 MODS */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            soundFX.playClick();
            onChangeServer('ARX BRAND SERVER 1 MODS');
          }}
          className={`py-2.5 px-3 rounded-2xl font-cyber font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            currentServer === 'ARX BRAND SERVER 1 MODS'
              ? 'bg-[#ff3344] text-white shadow-[0_4px_20px_rgba(255,51,68,0.5)] border border-red-400'
              : 'bg-[#0e121a]/80 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${currentServer === 'ARX BRAND SERVER 1 MODS' ? 'bg-white animate-ping' : 'bg-slate-600'}`} />
          <span className="truncate">ARX BRAND SERVER 1 MODS</span>
        </button>

        <button
          onClick={() => {
            soundFX.playClick();
            onChangeServer('SERVER 2');
          }}
          className={`py-2.5 px-3 rounded-2xl font-cyber font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            currentServer === 'SERVER 2'
              ? 'bg-[#ff3344] text-white shadow-[0_4px_20px_rgba(255,51,68,0.5)] border border-red-400'
              : 'bg-[#0e121a]/80 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${currentServer === 'SERVER 2' ? 'bg-white animate-ping' : 'bg-slate-600'}`} />
          <span>SERVER 2</span>
        </button>
      </div>

      {/* 4. Main Prediction Glass Card */}
      <div className="glass-panel-card rounded-3xl p-4 sm:p-5 relative overflow-hidden">
        {/* Laser Scanning Animation Overlay */}
        {isScanning && (
          <div className="absolute inset-0 z-30 bg-[#040508]/90 flex flex-col items-center justify-center p-4 backdrop-blur-md">
            <div className="w-4/5 h-0.5 bg-gradient-to-r from-transparent via-[#ff3344] to-transparent shadow-[0_0_20px_#ff3344] animate-laser" />
            <div className="mt-4 font-mono-cyber font-bold text-xs tracking-widest text-[#ff3344] animate-pulse">
              [ANALYZING ARX MODS CONSENSUS]
            </div>
          </div>
        )}

        {/* Card Header: NEXT PREDICTION + Batch */}
        <div className="flex items-center justify-between text-[11px] font-mono-cyber text-slate-400 mb-2">
          <span className="uppercase tracking-wider">
            NEXT PREDICTION ({currentServer === 'ARX BRAND SERVER 1 MODS' ? 'SERVER 1' : 'SERVER 2'})
          </span>
          <span className="px-2.5 py-0.5 bg-black/60 border border-white/10 rounded-full text-slate-300 font-semibold">
            {prediction?.batchInfo || '22 / 33'}
          </span>
        </div>

        {/* BIG / SMALL + Circular Dial */}
        <div className="flex items-center justify-between my-2">
          {/* Giant BIG / SMALL Typography */}
          <div className="flex flex-col">
            <div
              className={`font-serif font-black text-6xl tracking-wide uppercase transition-all duration-300 ${
                isBig ? 'text-[#ff3344] glow-text-red' : 'text-[#06b6d4] glow-text-cyan'
              }`}
            >
              {prediction?.side || 'BIG'}
            </div>
            <div className="flex items-center gap-2 font-mono-cyber text-xs text-slate-400 mt-1">
              <span>TARGET DIGIT:</span>
              <span className="font-bold text-[#ff4455] text-sm">{prediction?.number ?? 6}</span>
              <span className="text-slate-600">|</span>
              <span>HEDGE:</span>
              <span className="font-bold text-cyan-400 text-sm">{prediction?.opposite ?? 1}</span>
            </div>
          </div>

          {/* Circular Confidence Gauge */}
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800/80"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-emerald-400 transition-all duration-700"
                strokeWidth="7"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * confidenceValue) / 100}
                strokeLinecap="round"
                fill="none"
                style={{ filter: 'drop-shadow(0 0 8px #10b981)' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-cyber font-black text-sm text-white">
                {confidenceValue}%
              </span>
              <span className="text-[8px] font-mono-cyber text-slate-400 uppercase tracking-wider">
                CONF
              </span>
            </div>
          </div>
        </div>

        {/* Weighted Consensus Progress Bar */}
        <div className="mt-3 pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono-cyber text-slate-400 mb-1.5">
            <span>Weighted Consensus</span>
            <span className="text-emerald-400 font-bold">{confidenceValue}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]"
              style={{ width: `${confidenceValue}%` }}
            />
          </div>
        </div>

        {/* Rolling Accuracy (Last 10) */}
        <div className="mt-3 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono-cyber text-slate-400 mb-1.5">
            <span>ROLLING ACCURACY (LAST 10)</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-[9px] text-emerald-400 font-semibold">
                Pool: 512
              </span>
              <span className="text-slate-500">-</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400/80 w-4/5 rounded-full" />
            </div>
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400/80 w-3/4 rounded-full" />
            </div>
          </div>
        </div>

        {/* Bottom 3 Stat Glass Boxes: WIN RATE, TOTAL, WINS */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-2.5 glass-panel-sub rounded-2xl text-center">
            <div className="text-[9px] font-mono-cyber text-slate-400 uppercase">WIN RATE</div>
            <div className="text-base font-cyber font-bold text-emerald-400 mt-0.5">
              {stats.winRate > 0 ? `${stats.winRate}%` : '0%'}
            </div>
          </div>
          <div className="p-2.5 glass-panel-sub rounded-2xl text-center">
            <div className="text-[9px] font-mono-cyber text-slate-400 uppercase">TOTAL</div>
            <div className="text-base font-cyber font-bold text-white mt-0.5">
              {stats.total}
            </div>
          </div>
          <div className="p-2.5 glass-panel-sub rounded-2xl text-center">
            <div className="text-[9px] font-mono-cyber text-slate-400 uppercase">WINS</div>
            <div className="text-base font-cyber font-bold text-emerald-400 mt-0.5">
              {stats.wins}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Draw Results Glass Container */}
      <div className="glass-panel-card rounded-3xl p-4 relative">
        {/* Draw Header: 🔄 DRAW RESULTS + LIVE WINGO 30S Toggle */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFX.playClick();
                onRefreshManual();
              }}
              className="text-[#ff3344] hover:rotate-180 transition-transform cursor-pointer"
              title="Refresh"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <span className="font-cyber font-black text-xs tracking-wider text-white">
              DRAW RESULTS
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono-cyber text-[10px]">
            <span className="text-slate-400 uppercase">LIVE</span>
            <button
              onClick={() => onChangeGameMode(gameMode === 'WINGO_30S' ? 'WINGO_1M' : 'WINGO_30S')}
              className="px-2 py-0.5 bg-black/60 border border-white/10 rounded-lg text-emerald-400 font-bold hover:border-emerald-500 cursor-pointer transition-colors"
            >
              {gameMode === 'WINGO_30S' ? 'WINGO 30S' : 'WINGO 1M'}
            </button>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[10px] font-mono-cyber text-slate-500 uppercase tracking-wider border-b border-white/5">
          <div className="col-span-4">PERIOD</div>
          <div className="col-span-3 text-center">NUMBER</div>
          <div className="col-span-3 text-center">SIZE</div>
          <div className="col-span-2 text-right">COLOUR</div>
        </div>

        {/* Results List with 3D Balls */}
        <div className="divide-y divide-white/5 max-h-56 overflow-y-auto font-mono-cyber text-xs">
          {history.slice(0, 10).map((item) => {
            const isItemBig = item.size === 'BIG';
            const isRed = item.color.includes('RED');
            const isGreen = item.color.includes('GREEN');
            const isViolet = item.color.includes('VIOLET');

            let ballClass = 'lottery-ball-green';
            if (item.number === 0) ballClass = 'lottery-ball-split-violet-red';
            else if (item.number === 5) ballClass = 'lottery-ball-split-violet-green';
            else if (isRed) ballClass = 'lottery-ball-red';

            return (
              <div
                key={item.period}
                className="grid grid-cols-12 gap-2 px-2 py-2 items-center hover:bg-white/5 transition-colors"
              >
                {/* Period formatted as ...0631 */}
                <div className="col-span-4 text-slate-400 text-xs">
                  {formatPeriodShort(item.period)}
                </div>

                {/* 3D Shiny Sphere Ball */}
                <div className="col-span-3 flex justify-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[11px] ${ballClass}`}
                  >
                    {item.number}
                  </div>
                </div>

                {/* Size Badge */}
                <div className="col-span-3 flex justify-center">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isItemBig
                        ? 'bg-[#181119] border border-red-500/40 text-red-400'
                        : 'bg-[#0e1620] border border-cyan-500/40 text-cyan-400'
                    }`}
                  >
                    {item.size}
                  </span>
                </div>

                {/* Glowing Colour Dot */}
                <div className="col-span-2 flex justify-end items-center">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRed
                        ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                        : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Pill: ADVANCE HACKHACK AI ENGINE */}
        <div className="mt-3 pt-2 flex items-center justify-center">
          <div className="px-4 py-1 bg-black/60 border border-white/10 rounded-full text-[9px] font-mono-cyber uppercase tracking-widest text-slate-400">
            ADVANCE HACKHACK AI ENGINE
          </div>
        </div>
      </div>
    </div>
  );
};

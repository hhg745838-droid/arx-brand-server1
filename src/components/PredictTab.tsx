import React, { useState, useEffect } from 'react';
import {
  ServerType,
  PredictionResult,
  DrawItem,
  GameMode,
  TELEGRAM_CHANNEL_URL,
  DEVELOPER_TELEGRAM_URL,
} from '../types';
import {
  RotateCw,
  Send,
  Lock,
  Zap,
  Clock,
  Radio,
  ShieldCheck,
  Flame,
  AlertTriangle,
} from 'lucide-react';
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
  onTestWinAnimation?: () => void;
  onTestLossAnimation?: () => void;
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
  onTestWinAnimation,
  onTestLossAnimation,
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

  // Draw timing & Lock state calculation
  const totalCycleSeconds = gameMode === 'WINGO_30S' ? 30 : 60;
  const isLocked = remainingSeconds <= 5 && remainingSeconds > 0;
  const isDrawing = remainingSeconds === 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalCycleSeconds - remainingSeconds) / totalCycleSeconds) * 100)
  );

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <div className="relative z-10 w-full max-w-md mx-auto px-3.5 pb-24 pt-3 flex flex-col gap-3 font-sans gpu-120fps">
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
          <div className="text-[11px] font-mono-cyber text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Consensus · Live AR-Lottery Sync</span>
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

      {/* 120 FPS Ultra-Smooth Performance Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-red-950/40 via-black to-slate-950/60 border border-red-500/30 rounded-xl text-[10px] font-mono-cyber smooth-120">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>120 FPS ULTRA-SMOOTH GPU</span>
        </div>
        <div className="text-slate-300 flex items-center gap-1">
          <span className="text-slate-500">ENGINE LOCK:</span>
          <span
            className={`font-bold px-1.5 py-0.2 rounded border text-[9px] ${
              gameMode === 'WINGO_30S'
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-300'
                : 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
            }`}
          >
            {gameMode === 'WINGO_30S' ? '30S STRICT ONLY' : '1M STRICT ONLY'}
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

      {/* 3. API GAME MODE SELECTOR (30S vs 1M MODE SYSTEM) */}
      <div className="p-1 bg-[#090d14]/95 border border-slate-800 rounded-2xl shadow-xl flex flex-col gap-1">
        <div className="px-2 pt-1 flex items-center justify-between text-[10px] font-mono-cyber text-slate-400">
          <span className="uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span>API GAME CYCLE MODE:</span>
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ONLINE AR-LOTTERY</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-0.5">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onChangeGameMode('WINGO_30S');
            }}
            className={`py-2.5 px-3 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              gameMode === 'WINGO_30S'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-lg shadow-red-900/60 border border-red-400/60 scale-[1.01]'
                : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${gameMode === 'WINGO_30S' ? 'text-yellow-300 animate-pulse' : 'text-slate-500'}`} />
            <span>WINGO 30S</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-black/40 rounded-full border border-white/10 font-mono">
              30s
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onChangeGameMode('WINGO_1M');
            }}
            className={`py-2.5 px-3 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              gameMode === 'WINGO_1M'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-lg shadow-red-900/60 border border-red-400/60 scale-[1.01]'
                : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${gameMode === 'WINGO_1M' ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
            <span>WINGO 1M</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-black/40 rounded-full border border-white/10 font-mono">
              60s
            </span>
          </button>
        </div>
      </div>

      {/* 4. WAITING DRAW TIME COUNT & PREDICTION LOCK SYSTEM */}
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          isLocked
            ? 'bg-gradient-to-r from-red-950/80 via-black to-red-950/90 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
            : isDrawing
            ? 'bg-gradient-to-r from-cyan-950/80 via-black to-slate-900 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
            : 'bg-[#0d1017]/95 border-slate-800 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isLocked ? (
              <div className="w-5 h-5 rounded-full bg-red-600/30 flex items-center justify-center border border-red-500">
                <Lock className="w-3 h-3 text-red-400 animate-bounce" />
              </div>
            ) : isDrawing ? (
              <RotateCw className="w-4 h-4 text-cyan-400 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}

            <div>
              <div
                className={`font-mono-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                  isLocked ? 'text-red-400' : isDrawing ? 'text-cyan-400' : 'text-slate-200'
                }`}
              >
                {isLocked
                  ? '🔒 PREDICTION LOCKED · BETTING CLOSED'
                  : isDrawing
                  ? '⚡ DRAW IN PROGRESS · SYNCING API'
                  : '🟢 PREDICTION ACTIVE · BETTING OPEN'}
              </div>
              <div className="text-[10px] font-mono-cyber text-slate-500">
                {isLocked
                  ? 'Last 5s lock buffer · Awaiting official draw'
                  : isDrawing
                  ? 'Resolving target issue from AR-Lottery server'
                  : `${gameMode === 'WINGO_30S' ? 'WinGo 30S Rapid' : 'WinGo 1M Classic'} · Auto Consensus`}
              </div>
            </div>
          </div>

          <div
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono-cyber font-bold border tracking-wider ${
              isLocked
                ? 'bg-red-950 border-red-500/80 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : isDrawing
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-emerald-950 border-emerald-500/60 text-emerald-300'
            }`}
          >
            {isLocked ? 'LOCKED' : isDrawing ? 'DRAWING' : 'OPEN'}
          </div>
        </div>

        {/* Large Digital Waiting Draw Countdown */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs font-mono-cyber text-slate-400">
            <span className="text-[10px] text-slate-500 uppercase block">Waiting Draw Time:</span>
            <span className="font-cyber font-bold text-slate-300 text-xs sm:text-sm">
              PERIOD #{currentPeriod.slice(-4)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <div
              className={`px-3 py-1.5 rounded-xl font-mono-cyber font-black text-xl sm:text-2xl tracking-widest border transition-all ${
                isLocked
                  ? 'bg-red-950/90 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
                  : 'bg-black/90 border-white/20 text-white'
              }`}
            >
              {mm}:{ss}
            </div>
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full mt-2.5 overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isLocked
                ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_12px_#ef4444]'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_#10b981]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 5. Server Switcher with ARX BRAND SERVER 1 MODS */}
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
          <span
            className={`w-2 h-2 rounded-full ${
              currentServer === 'ARX BRAND SERVER 1 MODS' ? 'bg-white animate-ping' : 'bg-slate-600'
            }`}
          />
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
          <span
            className={`w-2 h-2 rounded-full ${
              currentServer === 'SERVER 2' ? 'bg-white animate-ping' : 'bg-slate-600'
            }`}
          />
          <span>SERVER 2</span>
        </button>
      </div>

      {/* 6. Main Prediction Glass Card */}
      <div className="glass-panel-card rounded-3xl p-4 sm:p-5 relative overflow-hidden">
        {/* PREDICTION LOCK OVERLAY (Active when <= 5s) */}
        {isLocked && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-[3px] border-2 border-red-500 rounded-3xl flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200 shadow-[0_0_35px_rgba(239,68,68,0.4)]">
            <div className="relative mb-2">
              <div className="absolute inset-0 rounded-full bg-red-600/30 blur-xl animate-ping" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-black border border-red-500 flex items-center justify-center shadow-lg shadow-red-950">
                <Lock className="w-7 h-7 text-red-200 animate-pulse" />
              </div>
            </div>

            <div className="font-cyber font-black text-lg text-white tracking-widest uppercase">
              PREDICTION LOCKED
            </div>
            <div className="text-sm font-mono-cyber text-red-400 font-bold mt-0.5">
              WAITING DRAW RESULT: {ss}s
            </div>
            <div className="text-[10px] font-mono-cyber text-slate-400 mt-2 max-w-xs leading-tight">
              Betting closed for Issue #{currentPeriod.slice(-4)} · AI Consensus sealed
            </div>

            <div className="mt-3 px-3.5 py-1.5 bg-black/80 border border-red-500/50 rounded-xl text-xs font-mono-cyber text-slate-200 flex items-center gap-2">
              <span className="text-slate-400">Locked Signal:</span>
              <span
                className={`font-cyber font-black ${
                  isBig ? 'text-red-400' : 'text-cyan-400'
                }`}
              >
                {prediction?.side}
              </span>
              <span>(Target Digit: {prediction?.number})</span>
            </div>
          </div>
        )}

        {/* Laser Scanning Animation Overlay */}
        {isScanning && !isLocked && (
          <div className="absolute inset-0 z-20 bg-[#040508]/90 flex flex-col items-center justify-center p-4 backdrop-blur-md">
            <div className="w-4/5 h-0.5 bg-gradient-to-r from-transparent via-[#ff3344] to-transparent shadow-[0_0_20px_#ff3344] animate-laser" />
            <div className="mt-4 font-mono-cyber font-bold text-xs tracking-widest text-[#ff3344] animate-pulse">
              [ANALYZING ARX MODS CONSENSUS]
            </div>
          </div>
        )}

        {/* Card Header: NEXT PREDICTION + Batch */}
        <div className="flex items-center justify-between text-[11px] font-mono-cyber text-slate-400 mb-2">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <span
              className={`font-bold px-1.5 py-0.2 rounded border text-[9px] ${
                gameMode === 'WINGO_30S'
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                  : 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
              }`}
            >
              {gameMode === 'WINGO_30S' ? '⚡ WINGO 30S' : '⏱️ WINGO 1M'}
            </span>
            <span>PREDICTION</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">{currentServer === 'ARX BRAND SERVER 1 MODS' ? 'SERVER 1 MODS' : 'SERVER 2'}</span>
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

      {/* 7. Draw Results Glass Container */}
      <div className="glass-panel-card rounded-3xl p-4 relative">
        {/* Draw Header: 🔄 DRAW RESULTS + Current Active Mode */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFX.playClick();
                onRefreshManual();
              }}
              className="text-[#ff3344] hover:rotate-180 transition-transform cursor-pointer"
              title="Refresh draw history"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <span className="font-cyber font-black text-xs tracking-wider text-white">
              DRAW RESULTS
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono-cyber text-[10px]">
            <span className="text-slate-400 uppercase">API:</span>
            <span className="px-2 py-0.5 bg-black/60 border border-white/10 rounded-lg text-emerald-400 font-bold">
              {gameMode === 'WINGO_30S' ? 'WINGO 30S' : 'WINGO 1M'}
            </span>
          </div>
        </div>

        {/* FX Animation Preview Bar */}
        {(onTestWinAnimation || onTestLossAnimation) && (
          <div className="flex items-center justify-between py-1 px-2.5 bg-black/50 border border-white/5 rounded-xl mb-2 text-[10px] font-mono-cyber">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>TEST FX:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onTestWinAnimation?.();
                }}
                className="px-2 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>🏆 WIN FX</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onTestLossAnimation?.();
                }}
                className="px-2 py-0.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>⚡ LOSS FX</span>
              </button>
            </div>
          </div>
        )}

        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[10px] font-mono-cyber text-slate-500 uppercase tracking-wider border-b border-white/5">
          <div className="col-span-4">PERIOD</div>
          <div className="col-span-3 text-center">NUMBER</div>
          <div className="col-span-3 text-center">BIG/SMALL</div>
          <div className="col-span-2 text-right">COLOR</div>
        </div>

        {/* Live Draw Rows */}
        <div className="divide-y divide-white/5 max-h-56 overflow-y-auto no-scrollbar">
          {history.slice(0, 10).map((draw, idx) => {
            const isRed =
              draw.color === 'RED' ||
              draw.color === 'RED+VIOLET' ||
              [0, 2, 4, 6, 8].includes(draw.number);
            const isViolet = draw.color === 'RED+VIOLET' || draw.color === 'GREEN+VIOLET';

            return (
              <div
                key={draw.period || idx}
                className="grid grid-cols-12 gap-2 px-2 py-2 items-center font-mono-cyber text-xs hover:bg-white/5 transition-colors"
              >
                <div className="col-span-4 text-slate-300 font-semibold truncate text-[11px]">
                  {formatPeriodShort(draw.period)}
                </div>

                <div className="col-span-3 flex justify-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ${
                      isViolet
                        ? 'bg-gradient-to-r from-red-600 to-purple-600'
                        : isRed
                        ? 'bg-red-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {draw.number}
                  </div>
                </div>

                <div className="col-span-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      draw.size === 'BIG'
                        ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                        : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {draw.size}
                  </span>
                </div>

                <div className="col-span-2 flex justify-end items-center gap-1">
                  {isViolet ? (
                    <div className="flex gap-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    </div>
                  ) : (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isRed ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

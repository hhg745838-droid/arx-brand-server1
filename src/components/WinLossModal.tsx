import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  X,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Zap,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { GameMode } from '../types';
import { soundFX } from '../utils/audio';

export interface WinLossModalProps {
  isOpen: boolean;
  type: 'WIN' | 'LOSS';
  gameMode?: GameMode;
  period: string;
  predictedSide: 'BIG' | 'SMALL';
  predictedNumber?: number;
  actualSide: 'BIG' | 'SMALL';
  actualNumber: number;
  actualColor?: string;
  streak?: number;
  onClose: () => void;
}

export const WinLossModal: React.FC<WinLossModalProps> = ({
  isOpen,
  type,
  gameMode = 'WINGO_30S',
  period,
  predictedSide,
  predictedNumber,
  actualSide,
  actualNumber,
  actualColor,
  streak = 1,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) return;

    // Play dedicated sounds
    if (type === 'WIN') {
      soundFX.playGrandFanfare();
    } else {
      soundFX.playHeavyLoss();
    }

    // Auto-dismiss countdown (5 seconds)
    setProgress(100);
    const duration = 5000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  const isWin = type === 'WIN';

  // Confetti particles for WIN
  const confettiPieces = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${2 + Math.random() * 2}s`,
    color: ['#eab308', '#22c55e', '#ef4444', '#38bdf8', '#a855f7'][i % 5],
    size: `${6 + Math.random() * 8}px`,
  }));

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Falling Confetti for Win */}
      {isWin && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {confettiPieces.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: p.left,
                top: '-20px',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                animation: `confettiFall ${p.duration} linear ${p.delay} infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Screen Vignette for Loss */}
      {!isWin && (
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(239,68,68,0.25)_100%)] animate-loss-glitch" />
      )}

      {/* Modal Container */}
      <div
        className={`relative z-10 w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl overflow-hidden flex flex-col items-center text-center transition-all ${
          isWin
            ? 'bg-gradient-to-b from-[#141b12] via-[#090e0b] to-[#050806] border-emerald-500/60 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
            : 'bg-gradient-to-b from-[#200f12] via-[#100709] to-[#070304] border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.35)]'
        }`}
      >
        {/* Rotating Sunburst Rays for Win */}
        {isWin && (
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 opacity-20 pointer-events-none animate-spin-slow">
            <div className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,#eab308,#22c55e,#38bdf8,#eab308)] blur-2xl" />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-slate-400 hover:text-white border border-white/10 cursor-pointer transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Badge Icon */}
        <div className="relative mb-4 mt-2">
          {isWin ? (
            <div className="relative flex items-center justify-center animate-victory-pulse">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl animate-ping" />
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-lime-400 p-0.5 shadow-2xl flex items-center justify-center">
                <div className="w-full h-full bg-[#09110d] rounded-3xl flex items-center justify-center border border-emerald-400/50">
                  <Trophy className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.9)]" />
                </div>
              </div>
              <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center animate-loss-glitch">
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl" />
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-900 p-0.5 shadow-2xl flex items-center justify-center">
                <div className="w-full h-full bg-[#130709] rounded-3xl flex items-center justify-center border border-red-500/50">
                  <ShieldAlert className="w-10 h-10 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Title */}
        <div className="flex flex-col gap-1.5 mb-3">
          {/* Active Mode Pill */}
          <div className="flex items-center justify-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-cyber font-bold border flex items-center gap-1.5 ${
                gameMode === 'WINGO_30S'
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                  : 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
              }`}
            >
              {gameMode === 'WINGO_30S' ? (
                <>
                  <Zap className="w-3 h-3 text-yellow-300 animate-pulse" />
                  <span>API WINGO 30S CYCLE</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-cyan-300 animate-pulse" />
                  <span>API WINGO 1M CYCLE</span>
                </>
              )}
            </span>
          </div>

          <div className="text-[11px] font-mono-cyber uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1.5">
            <span>PERIOD #{period.slice(-4)}</span>
            <span>·</span>
            <span>RESULT DRAWN</span>
          </div>

          <h2
            className={`font-cyber font-black text-2xl sm:text-3xl tracking-wider uppercase ${
              isWin
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-yellow-300 to-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]'
            }`}
          >
            {isWin ? 'TARGET HIT · WON!' : 'ROUND LOSS · SHIELD'}
          </h2>

          <div
            className={`text-xs font-mono-cyber font-bold ${
              isWin ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isWin
              ? '🎯 Prediction Accuracy 100% Matched!'
              : '⚡ Pattern deviation detected · Recovery active'}
          </div>
        </div>

        {/* Comparison Details Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 p-3.5 bg-black/60 border border-white/10 rounded-2xl mb-4 text-xs font-mono-cyber">
          {/* Predicted */}
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase mb-1">Predicted</span>
            <span
              className={`font-cyber font-black text-base ${
                predictedSide === 'BIG' ? 'text-red-400' : 'text-cyan-400'
              }`}
            >
              {predictedSide}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Digit: <strong className="text-white">{predictedNumber ?? '-'}</strong>
            </span>
          </div>

          {/* Actual Result */}
          <div
            className={`flex flex-col items-center justify-center p-2 rounded-xl border ${
              isWin ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-red-950/40 border-red-500/40'
            }`}
          >
            <span className="text-[10px] text-slate-400 uppercase mb-1">Actual Draw</span>
            <span
              className={`font-cyber font-black text-base ${
                actualSide === 'BIG' ? 'text-red-400' : 'text-cyan-400'
              }`}
            >
              {actualSide}
            </span>
            <span className="text-[10px] text-slate-300 mt-0.5">
              Number: <strong className="text-white text-xs">{actualNumber}</strong>
            </span>
          </div>
        </div>

        {/* Highlights Row (Streak / Multiplier) */}
        {isWin ? (
          <div className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-emerald-950/60 to-yellow-950/60 border border-emerald-500/40 rounded-xl mb-4 text-xs font-mono-cyber">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{streak > 1 ? `${streak}X WIN STREAK!` : 'CONSECUTIVE HIT!'}</span>
            </div>
            <div className="text-emerald-300 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+192% MULTIPLIER</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl mb-4 text-xs font-mono-cyber text-slate-300">
            <div className="flex items-center gap-1.5 text-red-300">
              <Zap className="w-4 h-4 text-red-400" />
              <span>Auto-tuning weights</span>
            </div>
            <div className="text-slate-400 text-[10px]">
              Next Period Reversal: 87%
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          className={`w-full py-3.5 px-6 font-cyber font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg border cursor-pointer transition-all flex items-center justify-center gap-2 text-white ${
            isWin
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400/50 shadow-emerald-900/50'
              : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 border-red-400/50 shadow-red-900/50'
          }`}
        >
          <span>{isWin ? 'CLAIM & NEXT PREDICTION' : 'CONTINUE TO NEXT PERIOD'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Auto Dismiss Progress Bar */}
        <div className="w-full mt-3 flex flex-col gap-1">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                isWin ? 'bg-emerald-400' : 'bg-red-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[9px] font-mono-cyber text-slate-500 text-center">
            Auto-closing in a few seconds...
          </div>
        </div>
      </div>
    </div>
  );
};

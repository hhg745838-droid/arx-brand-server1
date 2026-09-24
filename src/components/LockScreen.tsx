import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Send,
  MessageSquare,
  Loader2,
  Lock,
  Shield,
} from 'lucide-react';
import { soundFX } from '../utils/audio';
import {
  APP_LOGO,
  TELEGRAM_CHANNEL_URL,
  DEVELOPER_TELEGRAM_URL,
} from '../types';
import { verifyVipKeyWithFirebase, KeyValidationResult } from '../utils/firebase';

interface LockScreenProps {
  onUnlock: (key: string, keyData?: KeyValidationResult['keyData']) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [key, setKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusNote, setStatusNote] = useState('ENCRYPTED VIP GATEWAY · SECURE');

  const handleAuth = async () => {
    setError('');
    soundFX.playClick();

    const cleanKey = key.trim();
    if (!cleanKey) {
      setError('অনুগ্রহ করে আপনার পেইড VIP কী প্রবেশ করান।');
      soundFX.playLossBuzzer();
      return;
    }

    setIsVerifying(true);
    setStatusNote('Authenticating secure credentials...');
    soundFX.playScanLaser();

    try {
      const result = await verifyVipKeyWithFirebase(cleanKey);

      if (result.valid) {
        setStatusNote('VIP Access Verified · Unlocking...');
        soundFX.playWinChime();
        setTimeout(() => {
          setIsVerifying(false);
          onUnlock(cleanKey, result.keyData);
        }, 500);
      } else {
        setIsVerifying(false);
        setError(result.message);
        soundFX.playLossBuzzer();
        setStatusNote('ENCRYPTED VIP GATEWAY · SECURE');
      }
    } catch {
      setIsVerifying(false);
      setError('সার্ভার যাচাইকরণ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      soundFX.playLossBuzzer();
      setStatusNote('ENCRYPTED VIP GATEWAY · SECURE');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAuth();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-between p-4 bg-[#030407] text-slate-100 selection:bg-red-600 overflow-y-auto">
      {/* 4K Clear Full Screen Background Artwork */}
      <div className="cyber-logo-4k-bg opacity-70 pointer-events-none">
        <img
          src={APP_LOGO}
          alt="ARX BRAND Background"
          className="cyber-logo-4k-img"
        />
      </div>

      {/* Screen Vignette for Perfect Contrast */}
      <div className="cyber-screen-vignette pointer-events-none" />

      {/* Red Ambient Spotlight behind center badge */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full" />

      {/* Main Content Area matching Screenshot_20260924-114021.jpg */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center my-auto py-4">
        {/* 1. Center Square Shield Logo Badge */}
        <div className="relative w-36 h-36 mb-3 p-1.5 rounded-3xl bg-[#090c14]/90 border-2 border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.5)] flex items-center justify-center backdrop-blur-md">
          <img
            src={APP_LOGO}
            alt="ARX BRAND SERVER 1"
            className="w-full h-full object-contain rounded-2xl drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]"
          />
        </div>

        {/* 2. VIP Access Title + Red Subtitle */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-2xl">🔑</span>
          <h1 className="font-cyber font-black text-2xl sm:text-3xl tracking-wider text-white">
            VIP Access
          </h1>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-red-400 uppercase tracking-widest font-mono-cyber mb-5">
          <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
          <span>ARX BRAND SERVER 1 · NEURAL ENGINE</span>
        </div>

        {/* 3. Glass Login Card (Pure Paid Secure - Database Fully Hidden) */}
        <div className="w-full p-5 sm:p-6 rounded-3xl bg-[#0b0e16]/85 backdrop-blur-xl border border-red-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col gap-3">
          {/* Top Label: ◆ ENTER VIP KEY TO LOGIN */}
          <div className="flex items-center justify-between text-xs font-mono-cyber uppercase tracking-wider text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-sm">◆</span>
              <span>ENTER VIP KEY TO LOGIN</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
              <Lock className="w-2.5 h-2.5" />
              <span>PAID ONLY</span>
            </div>
          </div>

          {/* Key Label Row: 🔑 ACCESS KEY (কী প্রবেশ করান) + SHOW button */}
          <div className="flex items-center justify-between mt-1 text-xs font-mono-cyber">
            <div className="flex items-center gap-1.5 text-red-400">
              <span className="text-xs">🗝</span>
              <span className="font-bold tracking-wider">ACCESS KEY (কী প্রবেশ করান)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer transition-colors uppercase text-[11px]"
            >
              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showPassword ? 'HIDE' : 'SHOW'}</span>
            </button>
          </div>

          {/* Input Box */}
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              disabled={isVerifying}
              placeholder="ENTER VIP KEY (E.G. ADV..."
              className="w-full px-4 py-3.5 bg-black/80 border border-red-500/35 rounded-2xl text-white placeholder-slate-500 font-mono-cyber text-sm tracking-wider uppercase focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 shadow-inner transition-all pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Helper text */}
          <div className="text-[11px] font-mono-cyber text-slate-400 -mt-1">
            Enter your VIP Key to unlock prediction engine.
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-red-950/70 border border-red-500/60 rounded-xl text-xs font-mono-cyber text-red-200 flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Big Neon Red Submit Button: 🔑 LOGIN VIP ACCESS → */}
          <button
            onClick={handleAuth}
            disabled={isVerifying}
            className="w-full py-3.5 px-4 bg-[#ff3344] hover:bg-[#ff1f33] active:scale-[0.98] text-white font-cyber font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_4px_25px_rgba(255,51,68,0.5)] border border-red-400/60 flex items-center justify-center gap-2.5 cursor-pointer transition-all disabled:opacity-50 mt-1"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>VERIFYING CREDENTIALS...</span>
              </>
            ) : (
              <>
                <span>🔑</span>
                <span>LOGIN VIP ACCESS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Shielded Security Indicator (Database details completely hidden) */}
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-mono-cyber text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="truncate">{statusNote}</span>
          </div>
        </div>

        {/* 4. Bottom Action Buttons: CONTACT DEV and JOIN TELEGRAM */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4">
          <a
            href={DEVELOPER_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-[#0a1411]/80 hover:bg-[#0e211b] border border-emerald-500/40 rounded-full flex items-center justify-center gap-2 text-xs font-mono-cyber text-emerald-400 font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>CONTACT DEV</span>
          </a>

          <a
            href={TELEGRAM_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-[#0a111a]/80 hover:bg-[#0e1d2c] border border-sky-500/40 rounded-full flex items-center justify-center gap-2 text-xs font-mono-cyber text-sky-400 font-bold transition-all shadow-[0_0_12px_rgba(56,189,248,0.15)]"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>JOIN TELEGRAM</span>
          </a>
        </div>
      </div>

      <div className="w-full text-center py-2 text-[9px] font-mono-cyber text-slate-600">
        ARX BRAND SERVER 1 · ENCRYPTED HARDENED CORE · PRIVATE VIP ONLY
      </div>
    </div>
  );
};

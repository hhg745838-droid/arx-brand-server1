import React, { useState } from 'react';
import { User, Eye, EyeOff, LogOut, Send } from 'lucide-react';
import { APP_LOGO, TELEGRAM_CHANNEL_URL, MAIN_HEADER_NAME } from '../types';

interface HeaderProps {
  maskedKey: string;
  currentPeriod: string;
  latencyMs?: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  maskedKey,
  currentPeriod,
  latencyMs = 102,
  onLogout,
}) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#040508]/85 backdrop-blur-md border-b border-white/5 shadow-md">
      {/* Top Mobile Bar matching Screenshot */}
      <div className="max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Round Logo + Brand Title (ARX BRAND SERVER 1 UPDATE) */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0 bg-black">
            <img
              src={APP_LOGO}
              alt={MAIN_HEADER_NAME}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 leading-none">
              <span className="font-cyber text-[12px] sm:text-[13px] font-black tracking-wider text-white">
                ARX BRAND
              </span>
              <span className="font-cyber text-[12px] sm:text-[13px] font-black tracking-wider text-[#ff3344] glow-text-red">
                SERVER 1 UPDATE
              </span>
            </div>
            <span className="text-[8px] font-mono-cyber tracking-widest text-slate-400 uppercase mt-0.5">
              AI PREDICTION ENGINE
            </span>
          </div>
        </div>

        {/* Center: Profile Key Masked Pill `👤 ●●●●●● 👁` */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 border border-white/10 rounded-full font-mono-cyber text-[11px] text-slate-300">
          <User className="w-3 h-3 text-slate-400" />
          <span className="text-slate-300 tracking-widest text-[10px]">
            {showKey ? maskedKey.replace(/\*/g, 'X') : '••••••'}
          </span>
          <button
            onClick={() => setShowKey(!showKey)}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer p-0.5"
            aria-label="Toggle key visibility"
          >
            {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>

        {/* Right: Telegram Channel Shortcut, `● LIVE`, and Exit Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href={TELEGRAM_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Join Official Telegram Channel"
            className="p-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-300 transition-colors flex items-center justify-center cursor-pointer shadow-[0_0_8px_rgba(56,189,248,0.3)]"
          >
            <Send className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/50 rounded-full text-[10px] font-mono-cyber font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

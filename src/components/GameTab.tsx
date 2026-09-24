import React, { useState } from 'react';
import { Gamepad2, Globe, ArrowRight, ExternalLink, Sparkles, X, Minimize2, Maximize2, Shield } from 'lucide-react';
import { PredictionResult } from '../types';
import { soundFX } from '../utils/audio';

interface GameTabProps {
  prediction: PredictionResult | null;
  currentPeriod: string;
  remainingSeconds: number;
}

export const GameTab: React.FC<GameTabProps> = ({
  prediction,
  currentPeriod,
  remainingSeconds,
}) => {
  const [portalUrl, setPortalUrl] = useState('');
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isHudMinimized, setIsHudMinimized] = useState(false);

  const partners = [
    { name: 'WinGo Official', url: 'https://draw.ar-lottery01.com' },
    { name: 'Tiranga Portal', url: 'https://tirangagames.in' },
    { name: '91Club Portal', url: 'https://91club.com' },
    { name: 'Daman Platform', url: 'https://daman.vip' },
    { name: 'BigDaddy Game', url: 'https://bigdaddygame.com' },
    { name: 'BDG Official', url: 'https://bdg-game.com' },
  ];

  const handleOpenPortal = (target?: string) => {
    soundFX.playClick();
    const url = target || portalUrl.trim() || partners[0].url;
    setPortalUrl(url);
    setIsPortalOpen(true);
  };

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <div className="relative w-full max-w-2xl mx-auto px-3.5 pb-28 pt-4 flex flex-col gap-5">
      {/* Background Cyber Watermark */}
      <div className="cyber-watermark">
        <div>RAHMAN VA</div>
        <div>ADVANCE ADMIN</div>
      </div>

      {/* Main Game Platform Portal Card */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 bg-[#0f121a]/95 border border-red-500/30 rounded-2xl shadow-2xl glow-box-red text-center">
        {/* Glowing Red Gamepad Emblem */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-red-600/20 blur-xl animate-pulse" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-black border border-red-500/60 flex items-center justify-center shadow-lg shadow-red-950/80">
            <Gamepad2 className="w-8 h-8 text-red-100" />
          </div>
        </div>

        {/* Title & Description */}
        <h2 className="font-cyber font-bold text-lg sm:text-xl text-white tracking-widest uppercase mb-2">
          GAME PLATFORM <span className="text-red-500">PORTAL</span>
        </h2>
        <p className="text-xs font-mono-cyber text-slate-400 max-w-sm mb-6 leading-relaxed">
          Enter game website URL below or proceed to partner portal.
        </p>

        {/* URL Input Box */}
        <div className="w-full max-w-md relative mb-4">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <Globe className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={portalUrl}
            onChange={(e) => setPortalUrl(e.target.value)}
            placeholder="Enter website URL (Optional)"
            className="w-full pl-10 pr-4 py-3 bg-black/70 border border-slate-700/80 rounded-xl font-mono-cyber text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleOpenPortal()}
          className="w-full max-w-md py-3.5 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] text-white font-cyber font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-950/70 border border-red-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>NEXT / OPEN GAME PORTAL</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>

        {/* Partner Portals List */}
        <div className="w-full max-w-md mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-[10px] font-mono-cyber text-slate-500 uppercase tracking-wider mb-3">
            Quick Partner Portals
          </div>
          <div className="grid grid-cols-2 gap-2">
            {partners.map((partner) => (
              <button
                key={partner.name}
                onClick={() => handleOpenPortal(partner.url)}
                className="p-2 bg-slate-900/80 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/50 rounded-lg text-[11px] font-mono-cyber text-slate-300 hover:text-red-400 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{partner.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Embedded In-App Game Portal Modal with Floating AI HUD */}
      {isPortalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col backdrop-blur-md">
          {/* Top In-App Portal Bar */}
          <div className="px-4 py-2.5 bg-[#090b10] border-b border-red-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono-cyber text-slate-300 truncate">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{portalUrl || 'Partner Portal'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(portalUrl || partners[0].url, '_blank')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono-cyber text-slate-300 rounded flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open in Tab</span>
              </button>
              <button
                onClick={() => setIsPortalOpen(false)}
                className="p-1 rounded bg-red-950/60 text-red-300 hover:bg-red-900 border border-red-500/40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Portal Content Viewer / Interactive Playground */}
          <div className="relative flex-1 bg-[#06070a] overflow-hidden flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-md p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-cyber font-bold text-white text-base mb-1">
                SECURE GAME PLATFORM PORTAL
              </h3>
              <p className="text-xs font-mono-cyber text-slate-400 mb-4">
                Connected to: {portalUrl || 'https://draw.ar-lottery01.com'}
              </p>
              <div className="p-3 bg-black/60 border border-slate-800 rounded-xl text-left font-mono-cyber text-xs text-slate-300 space-y-1.5 mb-4">
                <div className="text-emerald-400">● AI Engine Active & Synced</div>
                <div>● Period: {currentPeriod}</div>
                <div>● Next Draw In: {mm}:{ss}</div>
                <div>● Target: {prediction?.side} (Digit {prediction?.number})</div>
              </div>
              <button
                onClick={() => window.open(portalUrl || partners[0].url, '_blank')}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-cyber text-xs rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>OPEN EXTERNAL GAME WINDOW</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Floating Live AI HUD Assistant */}
            <div className="absolute bottom-6 right-6 z-50">
              <div className="p-3.5 bg-[#0e1017]/95 border-2 border-red-500/80 rounded-2xl shadow-2xl glow-box-red flex flex-col gap-2 max-w-xs">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-cyber font-bold text-xs text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>HUD PREDICTION</span>
                  </div>
                  <button
                    onClick={() => setIsHudMinimized(!isHudMinimized)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {isHudMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                  </button>
                </div>

                {!isHudMinimized && (
                  <div className="font-mono-cyber text-xs space-y-1 pt-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Target:</span>
                      <span className="font-bold text-white">...{currentPeriod.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Outcome:</span>
                      <span
                        className={`text-lg font-cyber font-black tracking-wider ${
                          prediction?.side === 'BIG' ? 'text-red-400 glow-text-red' : 'text-cyan-400 glow-text-cyan'
                        }`}
                      >
                        {prediction?.side}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Digit / Hedge:</span>
                      <span className="text-emerald-400 font-bold">
                        {prediction?.number} / {prediction?.opposite}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                      <span>Time Remaining:</span>
                      <span className="text-amber-400 font-bold">
                        {mm}:{ss}
                      </span>
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

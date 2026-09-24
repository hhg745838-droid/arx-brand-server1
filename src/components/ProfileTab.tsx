import React, { useState } from 'react';
import { User, CheckCircle2, LogOut, Send, MessageSquare, Volume2, VolumeX, Smartphone, Key, Lock, ShieldCheck } from 'lucide-react';
import { UserProfile, APP_LOGO, TELEGRAM_CHANNEL_URL, DEVELOPER_TELEGRAM_URL } from '../types';
import { soundFX } from '../utils/audio';

interface ProfileTabProps {
  profile: UserProfile;
  onLogout: () => void;
  onUpdateSound: (enabled: boolean) => void;
  onOpenAdmin?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onLogout,
  onUpdateSound,
  onOpenAdmin,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    onUpdateSound(next);
    soundFX.setEnabled(next);
    if (next) soundFX.playClick();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-3.5 pb-28 pt-2 flex flex-col gap-4">
      {/* Background Cyber Watermark */}
      <div className="cyber-watermark">
        <div>RAHMAN VA</div>
        <div>ADVANCE ADMIN</div>
      </div>

      {/* Profile Header Bar with Quick Logout */}
      <div className="relative z-10 flex items-center justify-between gap-2 bg-[#0f121a]/95 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-950/70 border border-red-500/40 flex items-center justify-center">
            <User className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="font-cyber font-bold text-sm tracking-wider text-white">
              PROFILE <span className="text-red-500">ACCOUNT</span>
            </h2>
            <p className="text-[10px] font-mono-cyber text-slate-400">
              User details & subscription status
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playClick();
            onLogout();
          }}
          className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 rounded-lg text-xs font-mono-cyber text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400" />
          <span>LOGOUT</span>
        </button>
      </div>

      {/* VIP Key Account Card (Matching Video 00:10 - 00:12) */}
      <div className="relative z-10 bg-gradient-to-b from-[#141824]/95 to-[#0b0e14]/95 border border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-xl glow-box-red">
        {/* VIP Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/30 to-black border border-red-400/50 p-1 flex items-center justify-center shadow-md shadow-red-950 overflow-hidden">
              <img src={APP_LOGO} alt="VIP Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-cyber font-bold text-sm text-white tracking-wider">
                VIP KEY ACCOUNT
              </div>
              <div className="text-[10px] font-mono-cyber text-slate-400 flex items-center gap-1 mt-0.5">
                <Key className="w-3 h-3 text-amber-400" />
                <span>KEY: {profile.maskedKey}</span>
              </div>
            </div>
          </div>

          <div className="px-3 py-1 bg-emerald-950/70 border border-emerald-500/50 rounded-full text-[10px] font-mono-cyber font-bold text-emerald-400 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>ACTIVE</span>
          </div>
        </div>

        {/* Subscription Metadata */}
        <div className="space-y-2.5 font-mono-cyber text-xs">
          <div className="p-2.5 bg-black/50 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <span className="text-slate-400">EXPIRY DATE</span>
            <span className="font-bold text-white tracking-wider">
              {profile.expiryText || 'Lifetime'}
            </span>
          </div>
          <div className="p-2.5 bg-black/50 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>DEVICE BINDING</span>
            </span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>BOUND & VERIFIED</span>
            </span>
          </div>
        </div>
      </div>

      {/* Lifetime AI Stats Card */}
      <div className="relative z-10 bg-[#0f121a]/95 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="font-cyber font-bold text-xs tracking-wider text-white uppercase">
            LIFETIME AI STATS
          </h3>
          <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-500/40 rounded text-[11px] font-mono-cyber font-bold text-emerald-400">
            {profile.lifetimeAccuracy}% Accuracy
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-black/60 border border-slate-800 rounded-xl">
            <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">
              TOTAL PREDICTIONS
            </div>
            <div className="text-lg font-cyber font-bold text-white mt-1">
              {profile.totalPredictions}
            </div>
          </div>
          <div className="p-3 bg-black/60 border border-slate-800 rounded-xl">
            <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">WINS</div>
            <div className="text-lg font-cyber font-bold text-emerald-400 mt-1">
              {profile.wins}
            </div>
          </div>
          <div className="p-3 bg-black/60 border border-slate-800 rounded-xl">
            <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">
              WIN STREAK
            </div>
            <div className="text-lg font-cyber font-bold text-red-400 mt-1">
              {profile.winStreak}
            </div>
          </div>
        </div>
      </div>

      {/* Audio & Settings Card */}
      <div className="relative z-10 bg-[#0f121a]/95 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <div className="font-cyber font-bold text-xs text-white">CYBER AUDIO FX</div>
            <div className="text-[10px] font-mono-cyber text-slate-400">
              Synthesized matrix beeps & prediction chords
            </div>
          </div>
        </div>

        <button
          onClick={toggleSound}
          className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
            soundEnabled ? 'bg-red-600' : 'bg-slate-800'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              soundEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Action Buttons: Join Telegram, Contact Developer, Exit/Logout */}
      <div className="relative z-10 space-y-2.5">
        <button
          onClick={() => {
            soundFX.playClick();
            setShowTelegramModal(true);
          }}
          className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-cyber font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg border border-sky-400/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Send className="w-4 h-4" />
          <span>JOIN TELEGRAM</span>
        </button>

        <button
          onClick={() => {
            soundFX.playClick();
            setShowContactModal(true);
          }}
          className="w-full py-3 px-4 bg-[#141724] hover:bg-slate-800 border border-slate-700 text-slate-200 font-cyber font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>CONTACT DEVELOPER</span>
        </button>

        {onOpenAdmin && (
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenAdmin();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-950/80 via-black/90 to-red-950/80 hover:from-red-900/80 hover:to-red-900/80 border border-red-500/50 text-red-300 font-cyber font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)]"
          >
            <Lock className="w-4 h-4 text-red-400" />
            <span>⚙️ ADMIN PANEL · KEY GENERATOR</span>
          </button>
        )}

        <button
          onClick={() => {
            soundFX.playClick();
            onLogout();
          }}
          className="w-full py-3 px-4 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-cyber font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg border border-red-500/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>EXIT / LOGOUT</span>
        </button>
      </div>

      {/* Telegram Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm p-5 bg-[#0f121a] border border-sky-500/50 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-sky-600/20 border border-sky-500 flex items-center justify-center">
              <Send className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="font-cyber font-bold text-white text-base">
              OFFICIAL VIP TELEGRAM CHANNEL
            </h3>
            <p className="text-xs font-mono-cyber text-slate-400">
              Get live 100% win-streak signals, script updates, and server maintenance notices.
            </p>
            <div className="p-2.5 bg-black/60 rounded-xl font-mono-cyber text-xs text-sky-300 font-bold break-all">
              https://t.me/COLUR_TRADING_HACKER
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowTelegramModal(false)}
                className="py-2 bg-slate-800 text-slate-300 font-mono-cyber text-xs rounded-xl cursor-pointer hover:bg-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(TELEGRAM_CHANNEL_URL, '_blank');
                  setShowTelegramModal(false);
                }}
                className="py-2 bg-sky-600 hover:bg-sky-500 text-white font-cyber font-bold text-xs rounded-xl cursor-pointer"
              >
                Join Channel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Developer Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm p-5 bg-[#0f121a] border border-emerald-500/50 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-600/20 border border-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-cyber font-bold text-white text-base">
              CONTACT DEVELOPER SUPPORT
            </h3>
            <p className="text-xs font-mono-cyber text-slate-400">
              For VIP access keys, custom algorithm calibration, or API licensing.
            </p>
            <div className="p-3 bg-black/60 rounded-xl font-mono-cyber text-xs text-slate-300 text-left space-y-1.5">
              <div>• Developer Handle: <span className="text-emerald-400 font-bold">@Owner_Not_perfect</span></div>
              <div className="text-[11px] text-slate-400 break-all">• Direct: https://t.me/Owner_Not_perfect</div>
              <div>• Response Time: &lt; 15 mins</div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowContactModal(false)}
                className="py-2 bg-slate-800 text-slate-300 font-mono-cyber text-xs rounded-xl cursor-pointer hover:bg-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(DEVELOPER_TELEGRAM_URL, '_blank');
                  setShowContactModal(false);
                }}
                className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-cyber font-bold text-xs rounded-xl cursor-pointer"
              >
                Chat on Telegram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

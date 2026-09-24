import React, { useState } from 'react';
import { Database, Cpu, Zap, Sliders, ShieldAlert, Sparkles } from 'lucide-react';
import { AIModelWeight, DrawItem, PredictionResult } from '../types';
import { INITIAL_AI_MODELS, extractPatternString } from '../utils/engine';
import { soundFX } from '../utils/audio';

interface DatabaseTabProps {
  history: DrawItem[];
  prediction: PredictionResult | null;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ history, prediction }) => {
  const [models] = useState<AIModelWeight[]>(INITIAL_AI_MODELS);
  const [isAutoTuning, setIsAutoTuning] = useState(true);

  // Derive pattern from history
  const patternStr = extractPatternString(history, 10);
  const patternArray = patternStr.split('');

  const toggleAutoTuning = () => {
    soundFX.playClick();
    setIsAutoTuning(!isAutoTuning);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-3.5 pb-28 pt-2 flex flex-col gap-4">
      {/* Background Cyber Watermark */}
      <div className="cyber-watermark pointer-events-none">
        <div>RAHMAN VA</div>
        <div>ADVANCE ADMIN</div>
      </div>

      {/* Top Pattern Tape (S S B S B S S B S ...) */}
      <div className="relative z-10 p-3 bg-[#0f121a]/95 border border-slate-800 rounded-2xl shadow-lg">
        <div className="text-[10px] font-mono-cyber text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>SEQUENCE BUFFER</span>
          <span className="text-emerald-400 font-bold">10-DEPTH STREAM</span>
        </div>
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1">
          {patternArray.map((char, idx) => {
            const isB = char === 'B';
            return (
              <div
                key={idx}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-cyber font-black text-xs shrink-0 border shadow-sm transition-all ${
                  isB
                    ? 'bg-red-950/80 border-red-500 text-red-400 shadow-red-900/40'
                    : 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-amber-900/40'
                }`}
              >
                {char}
              </div>
            );
          })}
        </div>
      </div>

      {/* Database Match Box */}
      <div className="relative z-10 p-4 bg-gradient-to-r from-red-950/40 via-black to-slate-900/90 border border-red-500/40 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/60 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono-cyber font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              DATABASE MATCH FOUND
            </div>
            <div className="font-mono-cyber text-sm sm:text-base font-bold text-white tracking-widest mt-0.5">
              {patternStr}
            </div>
          </div>
        </div>

        <div className="px-4 py-2 bg-black/80 border border-red-500/60 rounded-xl font-cyber font-bold text-xs tracking-wider flex items-center gap-2">
          <span className="text-slate-400">PREDICT:</span>
          <span
            className={`${
              prediction?.side === 'BIG' ? 'text-red-400 glow-text-red' : 'text-cyan-400 glow-text-cyan'
            }`}
          >
            {prediction?.side || 'SMALL'}
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="relative z-10 grid grid-cols-3 gap-2">
        <div className="p-3 bg-[#0f121a]/95 border border-slate-800 rounded-xl text-center">
          <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">LEARNED</div>
          <div className="text-lg font-cyber font-bold text-emerald-400 mt-0.5">7</div>
        </div>
        <div className="p-3 bg-[#0f121a]/95 border border-slate-800 rounded-xl text-center">
          <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">DZ HITS</div>
          <div className="text-lg font-cyber font-bold text-slate-300 mt-0.5">0%</div>
        </div>
        <div className="p-3 bg-[#0f121a]/95 border border-slate-800 rounded-xl text-center">
          <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">QUERIES</div>
          <div className="text-lg font-cyber font-bold text-red-400 mt-0.5">2</div>
        </div>
      </div>

      {/* Top Dynamic Model Weights Section */}
      <div className="relative z-10 bg-[#0f121a]/95 border border-slate-800 rounded-2xl p-4 shadow-xl">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="font-cyber font-bold text-xs sm:text-sm tracking-wider text-white uppercase">
              TOP DYNAMIC MODEL WEIGHTS
            </h3>
          </div>

          <button
            onClick={toggleAutoTuning}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono-cyber font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isAutoTuning
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAutoTuning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>Auto-tuning</span>
          </button>
        </div>

        {/* Model Weight List */}
        <div className="divide-y divide-slate-800/40 max-h-96 overflow-y-auto font-mono-cyber">
          {models.map((model) => {
            const isGuard = model.status === 'guard';
            const is100 = model.accuracyRate === 100;

            return (
              <div
                key={model.id}
                className="py-2.5 px-2 hover:bg-slate-900/50 rounded-lg transition-colors flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {isGuard ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    )}
                    <span className="font-medium text-slate-200">{model.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={is100 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {model.accuracyRate > 0 ? `${model.accuracyRate}%` : '0%'} {model.hitsStr}
                    </span>
                    <span className="font-cyber font-bold text-amber-400 bg-black/60 px-1.5 py-0.5 rounded border border-slate-800">
                      +{model.weight.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isGuard
                        ? 'bg-amber-400'
                        : is100
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-r from-red-600 to-amber-500'
                    }`}
                    style={{ width: `${Math.max(15, model.accuracyRate)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-center font-mono-cyber text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
          <span>VERSION-X AI ENGINE</span>
          <span>·</span>
          <span>ADVANCE HACKHACK BY RAHMAN</span>
        </div>
      </div>
    </div>
  );
};

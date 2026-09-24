import React, { useState } from 'react';
import { HistoryRecord, ServerType } from '../types';
import { History, Trash2, Search, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface HistoryTabProps {
  records: HistoryRecord[];
  currentServer: ServerType;
  onChangeServer: (server: ServerType) => void;
  onClearHistory: () => void;
}

type FilterType = 'ALL' | 'WIN' | 'LOSS' | 'WAIT' | 'SKIPPED';

export const HistoryTab: React.FC<HistoryTabProps> = ({
  records,
  currentServer,
  onChangeServer,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  // Filter records by server
  const serverRecords = records.filter((r) => r.server === currentServer);

  // Apply search and filter
  const filtered = serverRecords.filter((r) => {
    if (searchQuery.trim() && !r.period.includes(searchQuery.trim())) {
      return false;
    }
    if (activeFilter === 'WIN') return r.result === 'WIN';
    if (activeFilter === 'LOSS') return r.result === 'LOSS';
    if (activeFilter === 'WAIT') return r.result === 'WAIT';
    return true;
  });

  const totalLogged = serverRecords.length;
  const wins = serverRecords.filter((r) => r.result === 'WIN').length;
  const losses = serverRecords.filter((r) => r.result === 'LOSS').length;
  const winRate = totalLogged > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto px-3.5 pb-28 pt-2 flex flex-col gap-4">
      {/* Background Cyber Watermark */}
      <div className="cyber-watermark">
        <div>RAHMAN VA</div>
        <div>ADVANCE ADMIN</div>
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 bg-[#0f121a]/95 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-950/70 border border-red-500/40 flex items-center justify-center">
            <History className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="font-cyber font-bold text-sm tracking-wider text-white">
              HISTORY <span className="text-red-500">LOGS</span>
            </h2>
            <p className="text-[10px] font-mono-cyber text-slate-400">
              Records for {currentServer}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playClick();
            onClearHistory();
          }}
          className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 rounded-lg text-xs font-mono-cyber text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>CLEAR</span>
        </button>
      </div>

      {/* Server Selector Switch */}
      <div className="relative z-10 grid grid-cols-2 gap-2 p-1 bg-[#0b0d14] border border-slate-800 rounded-xl">
        {(['ARX BRAND SERVER 1 MODS', 'SERVER 2'] as ServerType[]).map((srv) => {
          const isActive = currentServer === srv;
          return (
            <button
              key={srv}
              onClick={() => {
                soundFX.playClick();
                onChangeServer(srv);
              }}
              className={`py-2 px-3 rounded-lg font-cyber font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/60 border border-red-500/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-600'}`} />
              <span className="truncate">{srv}</span>
            </button>
          );
        })}
      </div>

      {/* Summary Stats Row */}
      <div className="relative z-10 grid grid-cols-3 gap-2">
        <div className="p-3 bg-[#0f121a]/95 border border-slate-800 rounded-xl text-center">
          <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">TOTAL LOGGED</div>
          <div className="text-lg font-cyber font-bold text-white mt-0.5">{totalLogged}</div>
        </div>
        <div className="p-3 bg-[#0f121a]/95 border border-slate-800 rounded-xl text-center">
          <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">WIN RATE</div>
          <div className="text-lg font-cyber font-bold text-emerald-400 mt-0.5">{winRate}%</div>
        </div>
        <div className="p-3 bg-[#0f121a]/95 border border-slate-800 rounded-xl text-center">
          <div className="text-[10px] font-mono-cyber text-slate-500 uppercase">WIN / LOSS</div>
          <div className="text-lg font-cyber font-bold text-red-400 mt-0.5">
            {wins}W / {losses}L
          </div>
        </div>
      </div>

      {/* Search Input & Filter Tabs */}
      <div className="relative z-10 bg-[#0f121a]/95 border border-slate-800 rounded-2xl p-3 flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search period number..."
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-slate-700/60 rounded-xl font-mono-cyber text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['ALL', 'WIN', 'LOSS', 'WAIT', 'SKIPPED'] as FilterType[]).map((flt) => {
            const isActive = activeFilter === flt;
            return (
              <button
                key={flt}
                onClick={() => {
                  soundFX.playClick();
                  setActiveFilter(flt);
                }}
                className={`px-3 py-1 rounded-lg font-mono-cyber text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {flt}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Table */}
      <div className="relative z-10 bg-[#0f121a]/95 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-black/50 text-[10px] font-mono-cyber text-slate-500 uppercase tracking-wider border-b border-slate-800">
          <div className="col-span-3">PERIOD</div>
          <div className="col-span-2 text-center">PRED</div>
          <div className="col-span-2 text-center">ACTUAL</div>
          <div className="col-span-3">LOGIC</div>
          <div className="col-span-2 text-right">RESULT</div>
        </div>

        {/* Records */}
        <div className="divide-y divide-slate-800/40 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="font-cyber text-sm text-slate-400">
                No prediction records found for {currentServer}.
              </p>
              <p className="text-[11px] font-mono-cyber text-slate-600 mt-1">
                Records will populate as active periods resolve.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isWin = item.result === 'WIN';
              const isWait = item.result === 'WAIT';

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center font-mono-cyber text-xs hover:bg-slate-900/40 transition-colors"
                >
                  {/* Period */}
                  <div className="col-span-3 text-slate-300 font-semibold text-[11px]">
                    {item.period.length > 4 ? `...${item.period.slice(-4)}` : item.period}
                  </div>

                  {/* Predicted */}
                  <div className="col-span-2 text-center">
                    <span
                      className={`text-[10px] font-bold ${
                        item.predictedSide === 'BIG' ? 'text-red-400' : 'text-cyan-400'
                      }`}
                    >
                      {item.predictedSide[0]}·{item.predictedNumber}
                    </span>
                  </div>

                  {/* Actual */}
                  <div className="col-span-2 text-center">
                    {item.actualNumber !== undefined ? (
                      <span className="text-white text-[11px]">
                        {item.actualNumber}
                        <span className="text-slate-400 text-[9px] ml-0.5">
                          ({item.actualSide?.[0]})
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">--</span>
                    )}
                  </div>

                  {/* Logic Used */}
                  <div className="col-span-3 text-[10px] text-slate-400 truncate">
                    {item.logic}
                  </div>

                  {/* Result Badge */}
                  <div className="col-span-2 flex justify-end">
                    {isWin ? (
                      <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/60 rounded text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        WIN
                      </span>
                    ) : isWait ? (
                      <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-500/60 rounded text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 animate-spin" />
                        WAIT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-950/80 border border-red-500/60 rounded text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <XCircle className="w-2.5 h-2.5" />
                        LOSS
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

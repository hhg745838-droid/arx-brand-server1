import React from 'react';
import { Layers, History, Gamepad2, Database, User } from 'lucide-react';
import { TabType } from '../types';
import { soundFX } from '../utils/audio';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs: {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    hasDot?: boolean;
  }[] = [
    {
      id: 'PREDICT',
      label: 'PREDICT',
      icon: <Layers className="w-5 h-5" />,
      hasDot: true,
    },
    {
      id: 'HISTORY',
      label: 'HISTORY',
      icon: <History className="w-5 h-5" />,
    },
    {
      id: 'GAME',
      label: 'GAME',
      icon: <Gamepad2 className="w-5 h-5" />,
    },
    {
      id: 'DB',
      label: 'DB',
      icon: <Database className="w-5 h-5" />,
      badge: '12',
    },
    {
      id: 'PROFILE',
      label: 'PROFILE',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#07090f]/95 backdrop-blur-2xl border-t border-white/10 py-1.5 px-3 shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFX.playClick();
                onSelectTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-red-950/40 text-[#ff3344] font-bold border border-red-500/30 shadow-[0_0_12px_rgba(255,51,68,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <div
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-105 text-[#ff3344] drop-shadow-[0_0_8px_rgba(255,51,68,0.8)]' : ''
                  }`}
                >
                  {tab.icon}
                </div>

                {/* Red dot for PREDICT tab */}
                {tab.hasDot && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#ff3344] shadow-[0_0_6px_#ff3344]" />
                )}

                {/* Red 12 badge for DB tab */}
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-[#ff3344] text-white text-[9px] font-mono-cyber font-bold rounded-full min-w-[14px] text-center shadow-[0_0_6px_#ff3344]">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[9px] font-cyber font-bold tracking-wider mt-1 uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

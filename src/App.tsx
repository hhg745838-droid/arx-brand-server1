import React, { useState, useEffect, useRef } from 'react';
import {
  TabType,
  ServerType,
  GameMode,
  DrawItem,
  PredictionResult,
  HistoryRecord,
  UserProfile,
  APP_LOGO,
} from './types';
import { LockScreen } from './components/LockScreen';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PredictTab } from './components/PredictTab';
import { HistoryTab } from './components/HistoryTab';
import { GameTab } from './components/GameTab';
import { DatabaseTab } from './components/DatabaseTab';
import { ProfileTab } from './components/ProfileTab';
import { AdminPanel } from './components/AdminPanel';
import { WinLossModal } from './components/WinLossModal';
import {
  getCycleState,
  generateDrawResult,
  getInitialDraws,
  fetchLiveDrawHistory,
  computeNextIssue,
} from './utils/lotteryService';
import { generatePrediction } from './utils/engine';
import { soundFX } from './utils/audio';

interface ModeEngineState {
  period: string;
  prevPeriod: string;
  remainingSeconds: number;
  drawHistory: DrawItem[];
  prediction: PredictionResult | null;
  isScanning: boolean;
  apiSource: string;
}

export default function App() {
  // Authentication state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arx_auth_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [userKey, setUserKey] = useState<string>(() => {
    try {
      return localStorage.getItem('arx_user_key') || '';
    } catch {
      return '';
    }
  });

  const [keyExpiryText, setKeyExpiryText] = useState<string>(() => {
    try {
      return localStorage.getItem('arx_key_expiry') || '29d 22h 24m 19s';
    } catch {
      return '29d 22h 24m 19s';
    }
  });

  // Navigation & Server Selection (Default: ARX BRAND SERVER 1 MODS)
  const [activeTab, setActiveTab] = useState<TabType>('PREDICT');
  const [currentServer, setCurrentServer] = useState<ServerType>('ARX BRAND SERVER 1 MODS');
  const [gameMode, setGameMode] = useState<GameMode>('WINGO_30S');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // DUAL-MODE ISOLATED ENGINE STATE (30S and 1M are 100% strictly independent)
  const [modesData, setModesData] = useState<Record<GameMode, ModeEngineState>>(() => {
    const init30 = getCycleState('WINGO_30S');
    const init1M = getCycleState('WINGO_1M');
    return {
      WINGO_30S: {
        period: init30.periodNumber,
        prevPeriod: init30.periodNumber,
        remainingSeconds: init30.remainingSeconds,
        drawHistory: getInitialDraws(init30.periodNumber, 20),
        prediction: null,
        isScanning: false,
        apiSource: 'Live 30S API',
      },
      WINGO_1M: {
        period: init1M.periodNumber,
        prevPeriod: init1M.periodNumber,
        remainingSeconds: init1M.remainingSeconds,
        drawHistory: getInitialDraws(init1M.periodNumber, 20),
        prediction: null,
        isScanning: false,
        apiSource: 'Live 1M API',
      },
    };
  });

  // History Records (persisted across sessions)
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('arx_history_records');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Premium Win / Loss Animation Modal State (Mode Isolated)
  const [winLossModal, setWinLossModal] = useState<{
    isOpen: boolean;
    type: 'WIN' | 'LOSS';
    gameMode: GameMode;
    period: string;
    predictedSide: 'BIG' | 'SMALL';
    predictedNumber?: number;
    actualSide: 'BIG' | 'SMALL';
    actualNumber: number;
    actualColor?: string;
    streak?: number;
  } | null>(null);

  // Active game mode reference for callbacks and intervals
  const activeGameModeRef = useRef<GameMode>(gameMode);
  activeGameModeRef.current = gameMode;

  const modesDataRef = useRef(modesData);
  modesDataRef.current = modesData;

  // Latency matching mobile screenshot (102ms - 105ms)
  const [latencyMs, setLatencyMs] = useState(102);

  useEffect(() => {
    const latInterval = setInterval(() => {
      setLatencyMs(100 + Math.floor(Math.random() * 5));
    }, 4000);
    return () => clearInterval(latInterval);
  }, []);

  // Synchronize with real game API for a specific game mode
  const syncWithRealApi = async (modeToFetch: GameMode) => {
    try {
      const liveData = await fetchLiveDrawHistory(modeToFetch);
      if (liveData && liveData.items.length > 0) {
        const latestDrawn = liveData.items[0];
        const nextPeriod = computeNextIssue(latestDrawn.period);

        // Update that specific mode's history & period ONLY
        setModesData((prev) => {
          const currentModeState = prev[modeToFetch];
          const existingPeriods = new Set(currentModeState.drawHistory.map((d) => d.period));
          const additions = liveData.items.filter((d) => !existingPeriods.has(d.period));
          const updatedHistory = [...additions, ...currentModeState.drawHistory].slice(0, 40);

          return {
            ...prev,
            [modeToFetch]: {
              ...currentModeState,
              drawHistory: updatedHistory,
              period: nextPeriod || currentModeState.period,
              apiSource: liveData.source,
            },
          };
        });

        // Resolve pending predictions for this mode
        setHistoryRecords((prev) => {
          let triggerModalPayload: any = null;
          const updated = prev.map((rec) => {
            // Match period and gameMode (or legacy records without gameMode)
            const matchesMode = rec.gameMode ? rec.gameMode === modeToFetch : true;
            if (matchesMode && rec.period === latestDrawn.period && rec.result === 'WAIT') {
              const isWin =
                rec.predictedSide === latestDrawn.size ||
                rec.predictedNumber === latestDrawn.number;

              // ONLY trigger modal if the user is currently on this game mode!
              if (modeToFetch === activeGameModeRef.current) {
                triggerModalPayload = {
                  isOpen: true,
                  type: isWin ? 'WIN' : 'LOSS',
                  gameMode: modeToFetch,
                  period: latestDrawn.period,
                  predictedSide: rec.predictedSide,
                  predictedNumber: rec.predictedNumber,
                  actualSide: latestDrawn.size,
                  actualNumber: latestDrawn.number,
                  actualColor: latestDrawn.color,
                  streak: isWin ? 2 : 0,
                };
              }

              return {
                ...rec,
                actualNumber: latestDrawn.number,
                actualSide: latestDrawn.size,
                result: isWin ? ('WIN' as const) : ('LOSS' as const),
              };
            }
            return rec;
          });

          if (triggerModalPayload) {
            setWinLossModal(triggerModalPayload);
          }

          try {
            localStorage.setItem('arx_history_records', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch {
      // Graceful fallback
    }
  };

  // API sync effect: polls for the active mode
  useEffect(() => {
    if (!isUnlocked) return;
    syncWithRealApi(gameMode);
    const apiInterval = setInterval(() => {
      syncWithRealApi(gameMode);
    }, 3500);
    return () => clearInterval(apiInterval);
  }, [gameMode, isUnlocked]);

  // Compute prediction strictly for WINGO_30S
  useEffect(() => {
    if (!isUnlocked) return;
    const current30Period = modesData.WINGO_30S.period;
    if (!current30Period) return;

    const timer = setTimeout(() => {
      const pred = generatePrediction(
        modesDataRef.current.WINGO_30S.drawHistory,
        current30Period,
        currentServer
      );

      setModesData((prev) => ({
        ...prev,
        WINGO_30S: {
          ...prev.WINGO_30S,
          prediction: pred,
          isScanning: false,
        },
      }));

      // Add to history records as 'WAIT' if not present
      setHistoryRecords((prev) => {
        const exists = prev.some(
          (r) =>
            r.period === current30Period &&
            r.server === currentServer &&
            r.gameMode === 'WINGO_30S'
        );
        if (exists) return prev;
        const newRec: HistoryRecord = {
          id: `${current30Period}-WINGO_30S-${currentServer}`,
          period: current30Period,
          server: currentServer,
          gameMode: 'WINGO_30S',
          predictedSide: pred.side,
          predictedNumber: pred.number,
          result: 'WAIT',
          logic: pred.modelUsed,
          timestamp: Date.now(),
        };
        const updated = [newRec, ...prev].slice(0, 60);
        try {
          localStorage.setItem('arx_history_records', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [modesData.WINGO_30S.period, currentServer, isUnlocked]);

  // Compute prediction strictly for WINGO_1M
  useEffect(() => {
    if (!isUnlocked) return;
    const current1MPeriod = modesData.WINGO_1M.period;
    if (!current1MPeriod) return;

    const timer = setTimeout(() => {
      const pred = generatePrediction(
        modesDataRef.current.WINGO_1M.drawHistory,
        current1MPeriod,
        currentServer
      );

      setModesData((prev) => ({
        ...prev,
        WINGO_1M: {
          ...prev.WINGO_1M,
          prediction: pred,
          isScanning: false,
        },
      }));

      // Add to history records as 'WAIT' if not present
      setHistoryRecords((prev) => {
        const exists = prev.some(
          (r) =>
            r.period === current1MPeriod &&
            r.server === currentServer &&
            r.gameMode === 'WINGO_1M'
        );
        if (exists) return prev;
        const newRec: HistoryRecord = {
          id: `${current1MPeriod}-WINGO_1M-${currentServer}`,
          period: current1MPeriod,
          server: currentServer,
          gameMode: 'WINGO_1M',
          predictedSide: pred.side,
          predictedNumber: pred.number,
          result: 'WAIT',
          logic: pred.modelUsed,
          timestamp: Date.now(),
        };
        const updated = [newRec, ...prev].slice(0, 60);
        try {
          localStorage.setItem('arx_history_records', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [modesData.WINGO_1M.period, currentServer, isUnlocked]);

  // Master 1-second countdown loop managing both 30S and 1M independently
  useEffect(() => {
    if (!isUnlocked) return;

    const interval = setInterval(() => {
      const c30 = getCycleState('WINGO_30S');
      const c1M = getCycleState('WINGO_1M');

      const activeRemaining =
        activeGameModeRef.current === 'WINGO_30S'
          ? c30.remainingSeconds
          : c1M.remainingSeconds;

      // Play lock warning sound at 5s, tick on 4,3,2,1 for active mode only
      if (activeRemaining === 5) {
        soundFX.playLockWarning();
      } else if (activeRemaining > 0 && activeRemaining < 5) {
        soundFX.playLockTick();
      }

      setModesData((prev) => {
        let next30 = { ...prev.WINGO_30S, remainingSeconds: c30.remainingSeconds };
        let next1M = { ...prev.WINGO_1M, remainingSeconds: c1M.remainingSeconds };

        // Handle 30S period transition
        if (c30.periodNumber !== prev.WINGO_30S.period && c30.periodNumber !== prev.WINGO_30S.prevPeriod) {
          const finished30 = prev.WINGO_30S.period;
          const existingDraw = prev.WINGO_30S.drawHistory.find((d) => d.period === finished30);
          const resolvedDraw = existingDraw || generateDrawResult(finished30);

          next30 = {
            ...next30,
            period: c30.periodNumber,
            prevPeriod: c30.periodNumber,
            drawHistory: existingDraw
              ? prev.WINGO_30S.drawHistory
              : [resolvedDraw, ...prev.WINGO_30S.drawHistory].slice(0, 40),
          };

          // Resolve 30S history records
          resolveModeRecords('WINGO_30S', finished30, resolvedDraw);
        }

        // Handle 1M period transition
        if (c1M.periodNumber !== prev.WINGO_1M.period && c1M.periodNumber !== prev.WINGO_1M.prevPeriod) {
          const finished1M = prev.WINGO_1M.period;
          const existingDraw = prev.WINGO_1M.drawHistory.find((d) => d.period === finished1M);
          const resolvedDraw = existingDraw || generateDrawResult(finished1M);

          next1M = {
            ...next1M,
            period: c1M.periodNumber,
            prevPeriod: c1M.periodNumber,
            drawHistory: existingDraw
              ? prev.WINGO_1M.drawHistory
              : [resolvedDraw, ...prev.WINGO_1M.drawHistory].slice(0, 40),
          };

          // Resolve 1M history records
          resolveModeRecords('WINGO_1M', finished1M, resolvedDraw);
        }

        return {
          WINGO_30S: next30,
          WINGO_1M: next1M,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isUnlocked]);

  // Helper to resolve pending records for a specific mode
  const resolveModeRecords = (
    mode: GameMode,
    finishedPeriod: string,
    resolvedDraw: DrawItem
  ) => {
    setHistoryRecords((prev) => {
      let modalPayload: any = null;
      const updated = prev.map((rec) => {
        const matchesMode = rec.gameMode ? rec.gameMode === mode : true;
        if (matchesMode && rec.period === finishedPeriod && rec.result === 'WAIT') {
          const isWin =
            rec.predictedSide === resolvedDraw.size ||
            rec.predictedNumber === resolvedDraw.number;

          // ONLY trigger modal if user is on this mode right now!
          if (activeGameModeRef.current === mode) {
            modalPayload = {
              isOpen: true,
              type: isWin ? 'WIN' : 'LOSS',
              gameMode: mode,
              period: finishedPeriod,
              predictedSide: rec.predictedSide,
              predictedNumber: rec.predictedNumber,
              actualSide: resolvedDraw.size,
              actualNumber: resolvedDraw.number,
              actualColor: resolvedDraw.color,
              streak: isWin ? 2 : 0,
            };
          }

          return {
            ...rec,
            actualNumber: resolvedDraw.number,
            actualSide: resolvedDraw.size,
            result: isWin ? ('WIN' as const) : ('LOSS' as const),
          };
        }
        return rec;
      });

      if (modalPayload) {
        setWinLossModal(modalPayload);
      }

      try {
        localStorage.setItem('arx_history_records', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Switch Game Mode seamlessly (120 FPS instant reaction)
  const handleSwitchGameMode = (newMode: GameMode) => {
    if (newMode === gameMode) return;
    soundFX.playClick();
    setGameMode(newMode);
    syncWithRealApi(newMode);
  };

  // Manual Refresh for the active mode
  const handleManualRefresh = () => {
    soundFX.playScanLaser();
    setModesData((prev) => ({
      ...prev,
      [gameMode]: {
        ...prev[gameMode],
        isScanning: true,
      },
    }));

    syncWithRealApi(gameMode);

    setTimeout(() => {
      const activeState = modesDataRef.current[gameMode];
      const pred = generatePrediction(
        activeState.drawHistory,
        activeState.period,
        currentServer
      );
      setModesData((prev) => ({
        ...prev,
        [gameMode]: {
          ...prev[gameMode],
          prediction: pred,
          isScanning: false,
        },
      }));
    }, 500);
  };

  // Get active mode's specific data
  const activeModeData = modesData[gameMode];

  // Calculate stats strictly for the selected mode
  const modeHistory = historyRecords.filter(
    (r) => !r.gameMode || r.gameMode === gameMode
  );
  const finishedRecords = modeHistory.filter((r) => r.result !== 'WAIT');
  const winsCount = finishedRecords.filter((r) => r.result === 'WIN').length;
  const totalCount = finishedRecords.length;
  const winRate =
    totalCount > 0 ? Math.round((winsCount / totalCount) * 100) : 89;

  // Clear history handler
  const handleClearHistory = () => {
    setHistoryRecords([]);
    try {
      localStorage.removeItem('arx_history_records');
    } catch {}
  };

  // Select history record to preview its animation
  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    if (record.result === 'WAIT') return;
    setWinLossModal({
      isOpen: true,
      type: record.result,
      gameMode: record.gameMode || gameMode,
      period: record.period,
      predictedSide: record.predictedSide,
      predictedNumber: record.predictedNumber,
      actualSide: record.actualSide || record.predictedSide,
      actualNumber: record.actualNumber ?? record.predictedNumber,
      actualColor: record.actualNumber !== undefined ? (record.actualNumber % 2 === 0 ? 'RED' : 'GREEN') : 'RED',
      streak: record.result === 'WIN' ? 2 : 0,
    });
  };

  const handleUnlock = (key: string, keyData?: { key: string; plan?: string; expiryText?: string }) => {
    setUserKey(key);
    const exp = keyData?.expiryText || '29d 22h 24m 19s';
    setKeyExpiryText(exp);
    setIsUnlocked(true);
    try {
      localStorage.setItem('arx_auth_unlocked', 'true');
      localStorage.setItem('arx_user_key', key);
      localStorage.setItem('arx_key_expiry', exp);
    } catch {}
  };

  const handleLockOut = () => {
    setIsUnlocked(false);
    try {
      localStorage.removeItem('arx_auth_unlocked');
    } catch {}
  };

  const triggerTestWinModal = () => {
    setWinLossModal({
      isOpen: true,
      type: 'WIN',
      gameMode: gameMode,
      period: activeModeData.period,
      predictedSide: activeModeData.prediction?.side || 'BIG',
      predictedNumber: activeModeData.prediction?.number ?? 7,
      actualSide: activeModeData.prediction?.side || 'BIG',
      actualNumber: activeModeData.prediction?.number ?? 7,
      actualColor: 'GREEN',
      streak: 3,
    });
  };

  const triggerTestLossModal = () => {
    setWinLossModal({
      isOpen: true,
      type: 'LOSS',
      gameMode: gameMode,
      period: activeModeData.period,
      predictedSide: activeModeData.prediction?.side || 'BIG',
      predictedNumber: activeModeData.prediction?.number ?? 8,
      actualSide: activeModeData.prediction?.side === 'BIG' ? 'SMALL' : 'BIG',
      actualNumber: activeModeData.prediction?.opposite ?? 2,
      actualColor: 'RED',
      streak: 0,
    });
  };

  const profileUser: UserProfile = {
    accessKey: userKey || 'ARX-VIP-1029-ALPHA',
    maskedKey: userKey ? `${userKey.slice(0, 4)}••••${userKey.slice(-4)}` : 'ARX-••••-1029',
    status: 'ACTIVE',
    expiryText: keyExpiryText,
    deviceBinding: 'Mobile / Web Chrome Active',
    lifetimeAccuracy: 89,
    totalPredictions: totalCount,
    wins: winsCount,
    winStreak: 2,
    soundEnabled: true,
    avatarUrl: APP_LOGO,
  };

  return (
    <div className="relative min-h-screen w-full bg-[#08090d] text-slate-100 flex flex-col items-center justify-start overflow-x-hidden selection:bg-red-500 selection:text-white">
      {/* 4K Clear Full Screen Background Graphic */}
      <div className="cyber-logo-4k-bg">
        <img
          src={APP_LOGO}
          alt="ARX BRAND SERVER 1"
          className="cyber-logo-4k-img"
          loading="eager"
        />
      </div>

      {/* Semi-transparent Vignette Overlay */}
      <div className="cyber-screen-vignette" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md min-h-screen flex flex-col justify-between">
        {!isUnlocked ? (
          <LockScreen
            onUnlock={handleUnlock}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        ) : (
          <>
            <Header
              maskedKey={profileUser.maskedKey}
              currentPeriod={activeModeData.period}
              latencyMs={latencyMs}
              onLogout={handleLockOut}
            />

            {/* TAB CONTENTS */}
            {activeTab === 'PREDICT' && (
              <PredictTab
                currentServer={currentServer}
                onChangeServer={setCurrentServer}
                gameMode={gameMode}
                onChangeGameMode={handleSwitchGameMode}
                prediction={activeModeData.prediction}
                history={activeModeData.drawHistory}
                remainingSeconds={activeModeData.remainingSeconds}
                isScanning={activeModeData.isScanning}
                currentPeriod={activeModeData.period}
                latencyMs={latencyMs}
                onRefreshManual={handleManualRefresh}
                stats={{
                  total: totalCount,
                  wins: winsCount,
                  winRate,
                }}
                onTestWinAnimation={triggerTestWinModal}
                onTestLossAnimation={triggerTestLossModal}
              />
            )}

            {activeTab === 'HISTORY' && (
              <HistoryTab
                records={historyRecords}
                currentServer={currentServer}
                onChangeServer={setCurrentServer}
                onClearHistory={handleClearHistory}
                onSelectRecord={handleSelectHistoryRecord}
              />
            )}

            {activeTab === 'GAME' && (
              <GameTab
                prediction={activeModeData.prediction}
                currentPeriod={activeModeData.period}
                remainingSeconds={activeModeData.remainingSeconds}
              />
            )}

            {activeTab === 'DB' && (
              <DatabaseTab
                history={activeModeData.drawHistory}
                prediction={activeModeData.prediction}
              />
            )}

            {activeTab === 'PROFILE' && (
              <ProfileTab
                profile={profileUser}
                onLogout={handleLockOut}
                onUpdateSound={(enabled) => soundFX.setEnabled(enabled)}
                onOpenAdmin={() => setIsAdminOpen(true)}
              />
            )}

            {/* BOTTOM DOCKED NAVIGATION */}
            <BottomNav currentTab={activeTab} onSelectTab={setActiveTab} />

            {/* HIGH-FIDELITY WIN / LOSS ANIMATION MODAL */}
            {winLossModal && (
              <WinLossModal
                isOpen={winLossModal.isOpen}
                type={winLossModal.type}
                gameMode={winLossModal.gameMode}
                period={winLossModal.period}
                predictedSide={winLossModal.predictedSide}
                predictedNumber={winLossModal.predictedNumber}
                actualSide={winLossModal.actualSide}
                actualNumber={winLossModal.actualNumber}
                actualColor={winLossModal.actualColor}
                streak={winLossModal.streak}
                onClose={() => setWinLossModal(null)}
              />
            )}
          </>
        )}
      </div>

      {/* DEDICATED FULL-SCREEN ADMIN PANEL MODAL */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-[999999] bg-[#07090e]/95 backdrop-blur-md overflow-y-auto pt-3 pb-8 px-2 sm:px-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between pb-2 mb-2 border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-cyber font-bold text-xs tracking-wider text-white uppercase">
                ADMIN ACCESS · FULL SECURE ENCRYPTION
              </span>
            </div>
            <button
              onClick={() => setIsAdminOpen(false)}
              className="px-3 py-1 bg-red-600/30 hover:bg-red-600 border border-red-500 rounded-xl text-xs font-cyber font-bold text-white transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.4)]"
            >
              ✕ CLOSE ADMIN
            </button>
          </div>
          <AdminPanel onClose={() => setIsAdminOpen(false)} />
        </div>
      )}
    </div>
  );
}

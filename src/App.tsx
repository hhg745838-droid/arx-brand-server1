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
import {
  getCycleState,
  generateDrawResult,
  getInitialDraws,
  fetchLiveDrawHistory,
  computeNextIssue,
} from './utils/lotteryService';
import { generatePrediction } from './utils/engine';
import { soundFX } from './utils/audio';

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

  // Cycle & Period State
  const initialCycle = getCycleState('WINGO_30S');
  const [currentPeriod, setCurrentPeriod] = useState<string>(initialCycle.periodNumber);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialCycle.remainingSeconds);
  const [apiSource, setApiSource] = useState<string>('Live AR-Lottery API');

  // Draws & Predictions
  const [drawHistory, setDrawHistory] = useState<DrawItem[]>(() =>
    getInitialDraws(initialCycle.periodNumber, 20)
  );
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('arx_history_records');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isScanning, setIsScanning] = useState(false);
  const latestApiIssueRef = useRef<string>('');
  const prevPeriodRef = useRef(currentPeriod);
  const drawHistoryRef = useRef(drawHistory);
  drawHistoryRef.current = drawHistory;

  // Latency matching mobile screenshot (102ms - 105ms)
  const [latencyMs, setLatencyMs] = useState(102);

  useEffect(() => {
    const latInterval = setInterval(() => {
      setLatencyMs(100 + Math.floor(Math.random() * 5));
    }, 4000);
    return () => clearInterval(latInterval);
  }, []);

  // Synchronize with real game API for the active game mode
  const syncWithRealApi = async (modeToFetch: GameMode) => {
    try {
      const liveData = await fetchLiveDrawHistory(modeToFetch);
      if (liveData && liveData.items.length > 0) {
        setApiSource(liveData.source);
        const latestDrawn = liveData.items[0];
        const nextPeriod = computeNextIssue(latestDrawn.period);
        latestApiIssueRef.current = latestDrawn.period;

        setDrawHistory((prev) => {
          const existingPeriods = new Set(prev.map((d) => d.period));
          const additions = liveData.items.filter((d) => !existingPeriods.has(d.period));
          return [...additions, ...prev].slice(0, 40);
        });

        // Resolve pending predictions with this latest draw
        setHistoryRecords((prev) => {
          return prev.map((rec) => {
            if (rec.period === latestDrawn.period && rec.result === 'WAIT') {
              const isWin =
                rec.predictedSide === latestDrawn.size ||
                rec.predictedNumber === latestDrawn.number;
              if (isWin) {
                setTimeout(() => soundFX.playWinChime(), 600);
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
        });

        // Advance to next period if needed
        if (nextPeriod && nextPeriod !== currentPeriod) {
          setCurrentPeriod(nextPeriod);
        }
      }
    } catch {
      // Graceful fallback
    }
  };

  // Initial sync & trigger on game mode switch
  useEffect(() => {
    if (!isUnlocked) return;
    syncWithRealApi(gameMode);
    const apiInterval = setInterval(() => {
      syncWithRealApi(gameMode);
    }, 3500);
    return () => clearInterval(apiInterval);
  }, [gameMode, isUnlocked]);

  // Compute prediction whenever period, history or server changes
  useEffect(() => {
    if (!isUnlocked || !currentPeriod) return;

    setIsScanning(true);
    soundFX.playScanLaser();

    const timer = setTimeout(() => {
      const pred = generatePrediction(drawHistoryRef.current, currentPeriod, currentServer);
      setCurrentPrediction(pred);
      setIsScanning(false);
      soundFX.playPredictionDrop();

      // Add to history records as 'WAIT' if not present
      setHistoryRecords((prev) => {
        const exists = prev.some((r) => r.period === currentPeriod && r.server === currentServer);
        if (exists) return prev;
        const newRec: HistoryRecord = {
          id: `${currentPeriod}-${currentServer}`,
          period: currentPeriod,
          server: currentServer,
          predictedSide: pred.side,
          predictedNumber: pred.number,
          result: 'WAIT',
          logic: pred.modelUsed,
          timestamp: Date.now(),
        };
        const updated = [newRec, ...prev].slice(0, 50);
        try {
          localStorage.setItem('arx_history_records', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }, 750);

    return () => clearTimeout(timer);
  }, [currentPeriod, currentServer, isUnlocked]);

  // Main countdown timer loop
  useEffect(() => {
    if (!isUnlocked) return;

    const interval = setInterval(() => {
      const cycle = getCycleState(gameMode, latestApiIssueRef.current);
      setRemainingSeconds(cycle.remainingSeconds);

      if (cycle.remainingSeconds === 5 || cycle.remainingSeconds === 3 || cycle.remainingSeconds === 1) {
        soundFX.playClick();
      }

      if (cycle.periodNumber !== currentPeriod) {
        const finishedPeriod = currentPeriod;
        const nextPeriod = cycle.periodNumber;

        const existingFinishedDraw = drawHistoryRef.current.find((d) => d.period === finishedPeriod);
        const resolvedDraw = existingFinishedDraw || generateDrawResult(finishedPeriod);

        if (!existingFinishedDraw) {
          setDrawHistory((prev) => [resolvedDraw, ...prev].slice(0, 40));
        }

        setHistoryRecords((prev) => {
          const updated = prev.map((rec) => {
            if (rec.period === finishedPeriod && rec.result === 'WAIT') {
              const isWin =
                rec.predictedSide === resolvedDraw.size ||
                rec.predictedNumber === resolvedDraw.number;
              if (isWin) {
                setTimeout(() => soundFX.playWinChime(), 800);
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
          try {
            localStorage.setItem('arx_history_records', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        prevPeriodRef.current = finishedPeriod;
        setCurrentPeriod(nextPeriod);

        syncWithRealApi(gameMode);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPeriod, gameMode, isUnlocked]);

  // Derived statistics
  const resolvedRecords = historyRecords.filter((r) => r.result !== 'WAIT');
  const winsCount = resolvedRecords.filter((r) => r.result === 'WIN').length;
  const totalCount = resolvedRecords.length;
  const winRate = totalCount > 0 ? Math.round((winsCount / totalCount) * 100) : 0;

  let currentStreak = 0;
  for (const r of resolvedRecords) {
    if (r.result === 'WIN') currentStreak++;
    else break;
  }

  const userProfile: UserProfile = {
    accessKey: userKey,
    maskedKey: userKey ? `${userKey.slice(0, 3)}••••••` : '••••••••',
    status: 'ACTIVE',
    expiryText: keyExpiryText,
    deviceBinding: 'BOUND & VERIFIED',
    lifetimeAccuracy: winRate,
    totalPredictions: totalCount,
    wins: winsCount,
    winStreak: currentStreak,
    soundEnabled: soundFX.isEnabled(),
  };

  const handleUnlock = (key: string, keyData?: any) => {
    setUserKey(key);
    setIsUnlocked(true);
    const exp = keyData?.expiryText || 'Active VIP';
    setKeyExpiryText(exp);
    try {
      localStorage.setItem('arx_auth_unlocked', 'true');
      localStorage.setItem('arx_user_key', key);
      localStorage.setItem('arx_key_expiry', exp);
    } catch {}
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setUserKey('');
    try {
      localStorage.removeItem('arx_auth_unlocked');
      localStorage.removeItem('arx_user_key');
      localStorage.removeItem('arx_key_expiry');
    } catch {}
  };

  const handleClearHistory = () => {
    setHistoryRecords([]);
    try {
      localStorage.removeItem('arx_history_records');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 selection:bg-red-600 selection:text-white relative overflow-x-hidden">
      {/* 4K Clear Full Screen Background Artwork */}
      <div className="cyber-logo-4k-bg">
        <img
          src={APP_LOGO}
          alt="ARX BRAND 4K Background"
          className="cyber-logo-4k-img"
        />
      </div>

      {/* Screen Vignette for Perfect Contrast */}
      <div className="cyber-screen-vignette" />

      {/* If locked, show high-tech cyber lock screen */}
      {!isUnlocked && <LockScreen onUnlock={handleUnlock} />}

      {/* Main Authenticated Experience */}
      {isUnlocked && (
        <div className="relative z-10 w-full flex flex-col min-h-screen">
          {/* Top Header Matching Screenshot */}
          <Header
            maskedKey={userProfile.maskedKey}
            currentPeriod={currentPeriod}
            latencyMs={latencyMs}
            onLogout={handleLogout}
          />

          {/* Active Tab View */}
          <main className="flex-1 w-full relative">
            {activeTab === 'PREDICT' && (
              <PredictTab
                currentServer={currentServer}
                onChangeServer={setCurrentServer}
                gameMode={gameMode}
                onChangeGameMode={(newMode) => {
                  setGameMode(newMode);
                  syncWithRealApi(newMode);
                }}
                prediction={currentPrediction}
                history={drawHistory}
                remainingSeconds={remainingSeconds}
                isScanning={isScanning}
                currentPeriod={currentPeriod}
                latencyMs={latencyMs}
                onRefreshManual={() => {
                  soundFX.playScanLaser();
                  setIsScanning(true);
                  syncWithRealApi(gameMode);
                  setTimeout(() => {
                    const pred = generatePrediction(drawHistory, currentPeriod, currentServer);
                    setCurrentPrediction(pred);
                    setIsScanning(false);
                  }, 600);
                }}
                stats={{
                  total: totalCount,
                  wins: winsCount,
                  winRate,
                }}
              />
            )}

            {activeTab === 'HISTORY' && (
              <HistoryTab
                records={historyRecords}
                currentServer={currentServer}
                onChangeServer={setCurrentServer}
                onClearHistory={handleClearHistory}
              />
            )}

            {activeTab === 'GAME' && (
              <GameTab
                prediction={currentPrediction}
                currentPeriod={currentPeriod}
                remainingSeconds={remainingSeconds}
              />
            )}

            {activeTab === 'DB' && (
              <DatabaseTab history={drawHistory} prediction={currentPrediction} />
            )}

            {activeTab === 'PROFILE' && (
              <ProfileTab
                profile={userProfile}
                onLogout={handleLogout}
                onUpdateSound={(val) => {
                  soundFX.setEnabled(val);
                }}
              />
            )}
          </main>

          {/* Bottom 5-Tab Navigation Matching Screenshot */}
          <BottomNav currentTab={activeTab} onSelectTab={setActiveTab} />
        </div>
      )}
    </div>
  );
}

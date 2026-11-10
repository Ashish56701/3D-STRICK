/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, WEAPON_CONFIGS } from './game/engine';
import { GameMode, CharacterSkin, WeaponType, GameSettings, PlayerStats } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { sound } from './game/audio';

type GameScreen = 'title' | 'playing' | 'gameover';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI States
  const [screen, setScreen] = useState<GameScreen>('title');
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Selection states
  const [selectedMode, setSelectedMode] = useState<GameMode>('survival');
  const [selectedSkin, setSelectedSkin] = useState<CharacterSkin>('commando');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('plasma_rifle');

  // Gameplay dynamic states
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    energy: 32,
    maxEnergy: 32,
    isReloading: false,
    reloadProgress: 0,
    score: 0,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    wave: 1,
    timeSurvived: 0,
    multiplier: 1,
    comboTimer: 0,
  });

  const [waveAnnouncement, setWaveAnnouncement] = useState<string | null>(null);
  const [hitmarker, setHitmarker] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [minimapData, setMinimapData] = useState<{
    player: { x: number; z: number; yaw: number };
    enemies: Array<{ x: number; z: number; type: string }>;
    powerups: Array<{ x: number; z: number; type: string }>;
  } | null>(null);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    graphicsQuality: 'high',
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    sensitivity: 1.2,
    isDaytime: false, // Default cyber night look
    invertY: false,
    showMinimap: true,
    cameraFov: 70,
  });

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, settings);
    engineRef.current = engine;

    // Callbacks
    engine.onStatsUpdate = (stats) => {
      setPlayerStats(stats);
    };

    engine.onHitEnemy = (isKill, headshot) => {
      setHitmarker(true);
      window.setTimeout(() => setHitmarker(false), 80);
    };

    engine.onWaveAnnounce = (wave, title) => {
      setWaveAnnouncement(title);
      window.setTimeout(() => setWaveAnnouncement(null), 3000);
    };

    engine.onGameOver = (victory, stats) => {
      setIsVictory(victory);
      setPlayerStats(stats);
      setScreen('gameover');
      document.exitPointerLock?.();
    };

    engine.onMinimapUpdate = (data) => {
      setMinimapData(data);
    };

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update engine when skin/weapon/settings change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSkin(selectedSkin);
    }
  }, [selectedSkin]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setWeapon(selectedWeapon);
    }
  }, [selectedWeapon]);

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    if (engineRef.current) {
      engineRef.current.settings = newSettings;
      engineRef.current.applyDayNightPreset(newSettings.isDaytime);
    }
  };

  const handleStartGame = () => {
    if (!engineRef.current) return;
    setScreen('playing');
    setIsPaused(false);

    if (selectedMode === 'training') {
      engineRef.current.startTrainingMode();
    } else if (selectedMode === 'survival') {
      engineRef.current.startSurvivalMode();
    } else if (selectedMode === 'time_challenge') {
      engineRef.current.startTimeChallenge();
    } else if (selectedMode === 'endless') {
      engineRef.current.startEndlessMode();
    }
  };

  const handlePause = () => {
    if (!engineRef.current) return;
    engineRef.current.togglePause();
    setIsPaused(engineRef.current.isPaused);
  };

  const handleResume = () => {
    if (!engineRef.current) return;
    engineRef.current.isPaused = false;
    setIsPaused(false);
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleQuitToMenu = () => {
    if (engineRef.current) {
      engineRef.current.isRunning = false;
      engineRef.current.isPaused = false;
    }
    sound.stopSciFiBgm();
    setIsPaused(false);
    setScreen('title');
  };

  const handleWeaponSwitch = () => {
    const weapons: WeaponType[] = ['plasma_rifle', 'scattergun', 'rail_sniper'];
    const currentIdx = weapons.indexOf(selectedWeapon);
    const nextIdx = (currentIdx + 1) % weapons.length;
    setSelectedWeapon(weapons[nextIdx]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyQ' && screen === 'playing' && !isPaused) {
        handleWeaponSwitch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isPaused, selectedWeapon]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-rajdhani select-none">
      {/* 3D WebGL Canvas isolated mount container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-crosshair"
      />

      {/* Screen 1: Title Screen / Main Menu */}
      {screen === 'title' && (
        <TitleScreen
          selectedMode={selectedMode}
          selectedSkin={selectedSkin}
          selectedWeapon={selectedWeapon}
          onSelectMode={setSelectedMode}
          onSelectSkin={setSelectedSkin}
          onSelectWeapon={setSelectedWeapon}
          onStartGame={handleStartGame}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Screen 2: Active Gameplay HUD */}
      {screen === 'playing' && (
        <GameHUD
          stats={playerStats}
          activeWeapon={selectedWeapon}
          mode={selectedMode}
          waveAnnouncement={waveAnnouncement}
          hitmarker={hitmarker}
          minimapData={minimapData}
          showMinimap={settings.showMinimap}
          onPause={handlePause}
          onJump={() => engineRef.current?.jump()}
          onReload={() => engineRef.current?.reload()}
          onWeaponSwitch={handleWeaponSwitch}
          onJoystickMove={(x, y) => {
            if (engineRef.current) {
              engineRef.current.virtualJoystick = { x, y };
            }
          }}
          onTouchLook={(dx, dy) => {
            engineRef.current?.handleTouchLook(dx, dy);
          }}
          onFireStart={() => {
            if (engineRef.current) {
              engineRef.current.isVirtualFiring = true;
            }
          }}
          onFireEnd={() => {
            if (engineRef.current) {
              engineRef.current.isVirtualFiring = false;
            }
          }}
        />
      )}

      {/* Pause Modal */}
      {isPaused && screen === 'playing' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenSettings={() => setShowSettings(true)}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Game Over / Victory Modal */}
      {screen === 'gameover' && (
        <GameOverModal
          victory={isVictory}
          stats={playerStats}
          mode={selectedMode}
          onPlayAgain={handleRestart}
          onMainMenu={handleQuitToMenu}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

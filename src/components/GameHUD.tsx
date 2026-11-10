import React, { useRef, useEffect, useState } from 'react';
import { PlayerStats, WeaponType, GameMode } from '../game/types';
import { WEAPON_CONFIGS } from '../game/engine';
import { sound } from '../game/audio';
import {
  Shield,
  Heart,
  Zap,
  Pause,
  Volume2,
  VolumeX,
  Target,
  Flame,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface GameHUDProps {
  stats: PlayerStats;
  activeWeapon: WeaponType;
  mode: GameMode;
  waveAnnouncement: string | null;
  hitmarker: boolean;
  minimapData: {
    player: { x: number; z: number; yaw: number };
    enemies: Array<{ x: number; z: number; type: string }>;
    powerups: Array<{ x: number; z: number; type: string }>;
  } | null;
  showMinimap: boolean;
  onPause: () => void;
  onJump: () => void;
  onReload: () => void;
  onWeaponSwitch: () => void;
  onJoystickMove: (x: number, y: number) => void;
  onTouchLook: (dx: number, dy: number) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  activeWeapon,
  mode,
  waveAnnouncement,
  hitmarker,
  minimapData,
  showMinimap,
  onPause,
  onJump,
  onReload,
  onWeaponSwitch,
  onJoystickMove,
  onTouchLook,
  onFireStart,
  onFireEnd,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  // Joystick touch tracking
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const touchLookStartRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      windowWidth <= 1024);
  const showTouchControls = isTouchDevice;

  const weaponConfig = WEAPON_CONFIGS[activeWeapon];

  const toggleMute = () => {
    sound.isMuted = !sound.isMuted;
    sound.updateVolumes();
    setIsMuted(sound.isMuted);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Pointer / Touch Joystick Handlers (Unified for touch & mouse)
  const isDraggingJoystickRef = useRef(false);

  const handleJoystickPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingJoystickRef.current = true;
    handleJoystickPointerMove(e);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingJoystickRef.current || !joystickBaseRef.current) return;
    e.stopPropagation();
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const maxRadius = rect.width / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let normX = dx;
    let normY = dy;
    if (dist > maxRadius) {
      normX = (dx / dist) * maxRadius;
      normY = (dy / dist) * maxRadius;
    }

    setStickPos({ x: normX, y: normY });
    onJoystickMove(normX / maxRadius, normY / maxRadius);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingJoystickRef.current = false;
    setStickPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  // Touch Look Area on right half
  const handleTouchLookStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    touchLookStartRef.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
  };

  const handleTouchLookMove = (e: React.TouchEvent) => {
    if (!touchLookStartRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchLookStartRef.current.id) {
        const dx = touch.clientX - touchLookStartRef.current.x;
        const dy = touch.clientY - touchLookStartRef.current.y;
        onTouchLook(dx, dy);
        touchLookStartRef.current.x = touch.clientX;
        touchLookStartRef.current.y = touch.clientY;
        break;
      }
    }
  };

  const handleTouchLookEnd = (e: React.TouchEvent) => {
    if (!touchLookStartRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchLookStartRef.current.id) {
        touchLookStartRef.current = null;
        break;
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden font-rajdhani">
      {/* Wave announcement banner */}
      {waveAnnouncement && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 text-center animate-bounce">
          <div className="px-6 py-2 rounded-xl bg-slate-900/90 border-2 border-cyan-400 text-cyan-300 font-orbitron font-black text-sm md:text-lg tracking-widest shadow-2xl neon-glow-cyan">
            {waveAnnouncement}
          </div>
        </div>
      )}

      {/* TOP BAR: Health / Shield & Score / Wave cluster */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        {/* Left Status Cluster: HP, Shield, Combos */}
        <div className="space-y-2 pointer-events-auto">
          {/* Health Bar */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 shadow-md">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
            <div className="w-28 md:w-36 h-3 bg-slate-900 rounded-sm overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-xs transition-all duration-200"
                style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-rose-300 tabular-nums w-12 text-right">
              {Math.max(0, Math.round(stats.health))} HP
            </span>
          </div>

          {/* Shield Bar */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 shadow-md">
            <Shield className="w-4 h-4 text-cyan-400 fill-cyan-400 shrink-0" />
            <div className="w-28 md:w-36 h-3 bg-slate-900 rounded-sm overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 rounded-xs transition-all duration-200"
                style={{ width: `${(stats.shield / stats.maxShield) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums w-12 text-right">
              {Math.max(0, Math.round(stats.shield))} SH
            </span>
          </div>

          {/* Multiplier / Combo */}
          {stats.multiplier > 1 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-orbitron font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.multiplier}X COMBO</span>
            </div>
          )}
        </div>

        {/* Center: Wave & Score Readout */}
        <div className="text-center bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            {mode === 'training'
              ? 'TRAINING FACILITY'
              : mode === 'time_challenge'
              ? 'TIME REMAINING'
              : `WAVE ${stats.wave}`}
          </div>
          <div className="text-lg md:text-2xl font-black font-orbitron text-cyan-400 tabular-nums">
            {mode === 'time_challenge'
              ? formatTimer(stats.timeSurvived)
              : stats.score.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-wider">
            {stats.kills} KILLS · {mode === 'survival' ? 'TARGET: WAVE 10' : 'ACTIVE PROTOCOL'}
          </div>
        </div>

        {/* Right: Quick actions & Minimap */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition"
              title="Pause Game (Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Minimap */}
          {showMinimap && minimapData && (
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-cyan-500/60 bg-slate-950/85 overflow-hidden shadow-xl neon-border-cyan">
              {/* Radar grid lines */}
              <div className="absolute inset-0 border border-cyan-500/20 rounded-full scale-50" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-cyan-500/20" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-cyan-500/20" />

              {/* Enemies */}
              {minimapData.enemies.map((e, idx) => {
                const relX = (e.x - minimapData.player.x) / 120;
                const relZ = (e.z - minimapData.player.z) / 120;
                const mapX = 50 + relX * 50;
                const mapY = 50 + relZ * 50;
                return (
                  <div
                    key={idx}
                    className="absolute w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${mapX}%`, top: `${mapY}%` }}
                  />
                );
              })}

              {/* Powerups */}
              {minimapData.powerups.map((p, idx) => {
                const relX = (p.x - minimapData.player.x) / 120;
                const relZ = (p.z - minimapData.player.z) / 120;
                const mapX = 50 + relX * 50;
                const mapY = 50 + relZ * 50;
                return (
                  <div
                    key={idx}
                    className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${mapX}%`, top: `${mapY}%` }}
                  />
                );
              })}

              {/* Player Arrow at center */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-cyan-300"
                style={{
                  transform: `translate(-50%, -50%) rotate(${
                    -minimapData.player.yaw * (180 / Math.PI) + 180
                  }deg)`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* CENTER CROSSHAIR & HITMARKER */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          {/* Static crosshair */}
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm" />
          <div className="absolute w-6 h-px bg-cyan-400/60" />
          <div className="absolute h-6 w-px bg-cyan-400/60" />
          <div className="absolute w-8 h-8 rounded-full border border-cyan-400/30" />

          {/* Hitmarker Flash */}
          {hitmarker && (
            <div className="absolute w-7 h-7 flex items-center justify-center animate-ping">
              <div className="w-5 h-5 border-2 border-red-500 rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Reloading Alert Banner */}
      {stats.isReloading && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div className="px-4 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 font-orbitron font-bold text-xs tracking-wider animate-pulse flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            RECHARGING ENERGY CELLS... {Math.round(stats.reloadProgress * 100)}%
          </div>
        </div>
      )}

      {/* BOTTOM-RIGHT: Ammo, Weapon info & Mobile action buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Weapon Readout Card */}
        <div className="bg-slate-950/85 border border-slate-800 rounded-xl p-3 shadow-xl min-w-44 text-right">
          <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
            <span>{weaponConfig.category}</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold font-orbitron text-slate-200">
            {weaponConfig.name}
          </div>

          <div className="flex items-baseline justify-end gap-1 mt-1 font-orbitron">
            <span className="text-2xl font-black text-cyan-400 tabular-nums">
              {stats.energy}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              / {stats.maxEnergy}
            </span>
          </div>

          {/* Reload indicator bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                stats.isReloading ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{
                width: stats.isReloading
                  ? `${stats.reloadProgress * 100}%`
                  : `${(stats.energy / stats.maxEnergy) * 100}%`,
              }}
            />
          </div>

          {/* Weapon switch button */}
          <button
            onClick={() => {
              sound.playClick();
              onWeaponSwitch();
            }}
            className="mt-2 text-xs py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 w-full transition font-semibold"
          >
            SWITCH ARSENAL (Q)
          </button>
        </div>

        {/* Mobile Action Controls Cluster */}
        {showTouchControls && (
          <div className="flex items-end gap-3">
            {/* Auxiliary actions */}
            <div className="flex flex-col gap-2">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onJump();
                }}
                className="w-12 h-12 rounded-full bg-slate-800/90 active:bg-cyan-600 text-slate-200 border border-slate-700 font-orbitron text-[10px] font-bold flex items-center justify-center shadow-md active:scale-95 cursor-pointer touch-none"
              >
                JUMP
              </button>

              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onReload();
                }}
                className="w-12 h-12 rounded-full bg-slate-800/90 active:bg-amber-600 text-slate-200 border border-slate-700 font-orbitron text-[10px] font-bold flex items-center justify-center shadow-md active:scale-95 cursor-pointer touch-none"
              >
                RELOAD
              </button>
            </div>

            {/* Primary Large Fire Button */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                onFireStart();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onFireEnd();
              }}
              onPointerCancel={(e) => {
                e.stopPropagation();
                onFireEnd();
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 active:from-cyan-400 active:to-blue-400 text-slate-950 border-2 border-cyan-300 font-orbitron font-black text-sm flex flex-col items-center justify-center shadow-2xl shadow-cyan-500/40 active:scale-95 cursor-pointer touch-none"
            >
              <Flame className="w-6 h-6 fill-current" />
              FIRE
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM-LEFT: Virtual Joystick for movement */}
      {showTouchControls && (
        <div className="absolute bottom-6 left-6 pointer-events-auto">
          <div
            ref={joystickBaseRef}
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
            className="relative w-32 h-32 rounded-full border-2 border-cyan-500/40 bg-slate-950/60 flex items-center justify-center shadow-xl game-touch-zone touch-none cursor-grab active:cursor-grabbing"
          >
            {/* Guide cross */}
            <div className="absolute w-full h-px bg-cyan-500/20 pointer-events-none" />
            <div className="absolute h-full w-px bg-cyan-500/20 pointer-events-none" />

            {/* Inner thumbstick */}
            <div
              className="w-14 h-14 rounded-full bg-cyan-500/80 border-2 border-cyan-300 shadow-lg pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              }}
            />
          </div>
          <div className="text-[10px] font-mono text-cyan-400/80 text-center mt-1">
            MOVE JOYSTICK
          </div>
        </div>
      )}

      {/* RIGHT HALF TOUCH LOOK ZONE for mobile camera */}
      {showTouchControls && (
        <div
          onTouchStart={handleTouchLookStart}
          onTouchMove={handleTouchLookMove}
          onTouchEnd={handleTouchLookEnd}
          className="absolute top-24 right-0 bottom-28 w-1/2 pointer-events-auto game-touch-zone opacity-0"
        />
      )}
    </div>
  );
};

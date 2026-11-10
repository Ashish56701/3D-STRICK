import React, { useState, useEffect } from 'react';
import { GameMode, CharacterSkin, WeaponType, CharacterSkinConfig } from '../game/types';
import { WEAPON_CONFIGS } from '../game/engine';
import { sound } from '../game/audio';
import {
  Play,
  Shield,
  Zap,
  Target,
  Trophy,
  Settings,
  Crosshair,
  Sparkles,
  ChevronRight,
  User,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';

interface TitleScreenProps {
  selectedMode: GameMode;
  selectedSkin: CharacterSkin;
  selectedWeapon: WeaponType;
  onSelectMode: (mode: GameMode) => void;
  onSelectSkin: (skin: CharacterSkin) => void;
  onSelectWeapon: (weapon: WeaponType) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
}

export const CHARACTER_SKINS: CharacterSkinConfig[] = [
  {
    id: 'commando',
    name: 'CYBER COMMANDO',
    title: 'Tactical Recon Operator',
    primaryColor: 0x1e293b,
    secondaryColor: 0x334155,
    accentColor: 0x06b6d4,
    armorBonus: 0,
    speedBonus: 10,
    description: 'All-round veteran soldier outfitted with reinforced carbon armor and high-output thrusters.',
  },
  {
    id: 'vanguard',
    name: 'SOLAR VANGUARD',
    title: 'Heavy Plating Bastion',
    primaryColor: 0x78350f,
    secondaryColor: 0xd97706,
    accentColor: 0xf59e0b,
    armorBonus: 25,
    speedBonus: 0,
    description: 'Forged from high-temperature desert alloy plates. Heavy ballistic resistance and energy shielding.',
  },
  {
    id: 'phantom',
    name: 'NEON PHANTOM',
    title: 'Covert Cyber Infiltrator',
    primaryColor: 0x09090b,
    secondaryColor: 0x27272a,
    accentColor: 0xf43f5e,
    armorBonus: -5,
    speedBonus: 20,
    description: 'Stealth frame designed for hyper-mobility and devastating rapid-fire flank assaults.',
  },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedMode,
  selectedSkin,
  selectedWeapon,
  onSelectMode,
  onSelectSkin,
  onSelectWeapon,
  onStartGame,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'deploy' | 'skins' | 'armory' | 'records'>('deploy');
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  useEffect(() => {
    // Read high scores from localStorage
    const scores: Record<string, number> = {};
    const modes: GameMode[] = ['survival', 'time_challenge', 'endless', 'training'];
    modes.forEach((m) => {
      try {
        const val = localStorage.getItem(`3dstrike_highscore_${m}`);
        scores[m] = val ? parseInt(val, 10) : 0;
      } catch {
        scores[m] = 0;
      }
    });
    setHighScores(scores);
  }, []);

  // Keyboard shortcut to start game (Enter or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        sound.playClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 md:p-8 select-none font-rajdhani text-slate-100 overflow-y-auto">
      {/* TOP HEADER: Bespoke Title Lockup */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          {/* Bespoke inline SVG Title Lockup */}
          <div className="flex items-center gap-3">
            <svg
              className="w-10 h-10 md:w-12 md:h-12 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="32,4 58,18 58,46 32,60 6,46 6,18"
                stroke="currentColor"
                strokeWidth="3"
                fill="rgba(6, 182, 212, 0.15)"
              />
              <path
                d="M20 32L28 40L44 24"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="32" r="6" fill="#06b6d4" />
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800">
                  PROTOCOL 3.8 // TACTICAL SHOOTER
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black font-orbitron tracking-wider text-slate-100 neon-glow-cyan">
                3D STRIKE<span className="text-cyan-400">:</span> ULTIMATE SURVIVAL
              </h1>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="flex items-center gap-2 py-2 px-3.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-xs font-orbitron font-bold transition shadow-lg"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            SYSTEM SETTINGS
          </button>
        </div>
      </div>

      {/* CENTER INTERFACE DOCK */}
      <div className="my-auto py-6 max-w-4xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 mb-6 font-orbitron text-xs md:text-sm">
          {[
            { id: 'deploy', label: 'DEPLOY OPERATION', icon: Play },
            { id: 'skins', label: 'OPERATOR SKINS', icon: User },
            { id: 'armory', label: 'WEAPON ARSENAL', icon: Target },
            { id: 'records', label: 'HALL OF FAME', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-2 py-2.5 px-3 md:px-5 rounded-lg font-bold transition border ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DEPLOY MODES */}
        {activeTab === 'deploy' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  id: 'survival' as GameMode,
                  title: 'SURVIVAL WAVES',
                  badge: 'TACTICAL CAMPAIGN',
                  desc: 'Survive 10 escalating robot waves with heavy boss mechs.',
                  color: 'cyan',
                },
                {
                  id: 'endless' as GameMode,
                  title: 'ENDLESS HORDE',
                  badge: 'INFINITE PROTOCOL',
                  desc: 'Continuous scaling robotic waves with dynamic multiplier.',
                  color: 'amber',
                },
                {
                  id: 'time_challenge' as GameMode,
                  title: 'TIME CHALLENGE',
                  badge: 'RAPID ELIMINATION',
                  desc: '3-minute countdown sprint. Score extra seconds per kill.',
                  color: 'purple',
                },
                {
                  id: 'training' as GameMode,
                  title: 'TARGET RANGE',
                  badge: 'WEAPONS LAB',
                  desc: 'Target practice dummies, infinite energy, zero hazard.',
                  color: 'emerald',
                },
              ].map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectMode(m.id);
                    }}
                    className={`cursor-pointer rounded-xl p-4 transition border ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-400 neon-border-cyan shadow-xl scale-[1.02]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <span className="text-[10px] font-mono tracking-wider font-bold text-cyan-400">
                      {m.badge}
                    </span>
                    <h3 className="text-base font-bold font-orbitron text-slate-100 mt-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {m.desc}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>BEST: {highScores[m.id]?.toLocaleString() || 0}</span>
                      {isSelected && (
                        <span className="text-cyan-400 font-bold">READY</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Primary Big Start CTA */}
            <div className="pt-4 flex flex-col items-center">
              <button
                onClick={() => {
                  sound.playClick();
                  onStartGame();
                }}
                className="group relative flex items-center justify-center gap-4 py-4 px-12 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black font-orbitron text-lg md:text-xl tracking-wider shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-6 h-6 fill-current transition-transform group-hover:translate-x-1" />
                INITIATE STRIKE
              </button>
              <div className="mt-2 text-xs font-mono text-slate-400">
                Press <span className="text-cyan-400 font-bold">ENTER</span> or click to deploy into combat
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPERATOR SKINS */}
        {activeTab === 'skins' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CHARACTER_SKINS.map((skin) => {
              const isSelected = selectedSkin === skin.id;
              return (
                <div
                  key={skin.id}
                  onClick={() => {
                    sound.playClick();
                    onSelectSkin(skin.id);
                  }}
                  className={`cursor-pointer rounded-xl p-5 border transition ${
                    isSelected
                      ? 'bg-slate-900/95 border-cyan-400 neon-border-cyan shadow-xl scale-[1.02]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {skin.title}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-cyan-500 text-slate-950">
                        EQUIPPED
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-orbitron text-slate-100">
                    {skin.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {skin.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shield Plating:</span>
                      <span className="font-bold text-cyan-300">
                        {skin.armorBonus >= 0 ? `+${skin.armorBonus}%` : `${skin.armorBonus}%`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Movement Velocity:</span>
                      <span className="font-bold text-emerald-400">
                        +{skin.speedBonus}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: WEAPON ARSENAL */}
        {activeTab === 'armory' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(WEAPON_CONFIGS) as WeaponType[]).map((wKey) => {
              const weapon = WEAPON_CONFIGS[wKey];
              const isSelected = selectedWeapon === wKey;
              return (
                <div
                  key={wKey}
                  onClick={() => {
                    sound.playClick();
                    onSelectWeapon(wKey);
                  }}
                  className={`cursor-pointer rounded-xl p-5 border transition ${
                    isSelected
                      ? 'bg-slate-900/95 border-cyan-400 neon-border-cyan shadow-xl scale-[1.02]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {weapon.category}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-cyan-500 text-slate-950">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-orbitron text-slate-100">
                    {weapon.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {weapon.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">DAMAGE</span>
                      <span className="font-bold text-rose-400">{weapon.damage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">FIRE RATE</span>
                      <span className="font-bold text-cyan-400">{weapon.fireRate}/s</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CAPACITY</span>
                      <span className="font-bold text-amber-400">{weapon.capacity}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">RELOAD</span>
                      <span className="font-bold text-slate-300">{weapon.reloadTime}s</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: HIGH SCORE RECORDS */}
        {activeTab === 'records' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 shadow-xl max-w-xl mx-auto">
            <h3 className="text-lg font-bold font-orbitron text-cyan-400 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> MISSION ARCHIVES // LEADERBOARD
            </h3>
            <div className="space-y-3 font-mono text-sm">
              {[
                { label: 'SURVIVAL MODE RECORD', key: 'survival' },
                { label: 'ENDLESS HORDE RECORD', key: 'endless' },
                { label: 'TIME CHALLENGE SPRINT', key: 'time_challenge' },
                { label: 'TRAINING FACILITY SCORE', key: 'training' },
              ].map((rec) => (
                <div
                  key={rec.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <span className="text-slate-300">{rec.label}</span>
                  <span className="text-cyan-400 font-bold font-orbitron text-base tabular-nums">
                    {(highScores[rec.key] || 0).toLocaleString()} PTS
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: Flat control hint line */}
      <div className="text-center pt-4 border-t border-slate-800/80 text-xs text-slate-400 font-mono tracking-wider">
        <span className="text-slate-200 font-bold">WASD</span> Move ·{' '}
        <span className="text-slate-200 font-bold">Mouse</span> Aim & Shoot ·{' '}
        <span className="text-slate-200 font-bold">Space</span> Jump ·{' '}
        <span className="text-slate-200 font-bold">Shift</span> Sprint ·{' '}
        <span className="text-slate-200 font-bold">R</span> Reload ·{' '}
        <span className="text-slate-200 font-bold">Esc</span> Pause
      </div>
    </div>
  );
};

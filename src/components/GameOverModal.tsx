import React from 'react';
import { PlayerStats, GameMode } from '../game/types';
import { sound } from '../game/audio';
import { Trophy, RotateCcw, Home, Skull, ShieldCheck, Target, Clock, Zap } from 'lucide-react';

interface GameOverModalProps {
  victory: boolean;
  stats: PlayerStats;
  mode: GameMode;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  victory,
  stats,
  mode,
  onPlayAgain,
  onMainMenu,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const accuracy =
    stats.shotsFired > 0
      ? Math.round((stats.shotsHit / stats.shotsFired) * 100)
      : 0;

  // Check if new high score
  let isNewHighScore = false;
  try {
    const key = `3dstrike_highscore_${mode}`;
    const previous = parseInt(localStorage.getItem(key) || '0', 10);
    isNewHighScore = stats.score > 0 && stats.score >= previous;
  } catch {
    // Ignore
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 rounded-2xl p-6 md:p-8 shadow-2xl text-center overflow-hidden border-cyan-500/80 neon-border-cyan">
        {/* Glow backdrop decorative gradient */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
            victory ? 'bg-cyan-500' : 'bg-red-500'
          }`}
        />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase mb-2 bg-slate-800 border border-slate-700 text-slate-300">
          {victory ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> MISSION ACCOMPLISHED
            </>
          ) : (
            <>
              <Skull className="w-3.5 h-3.5 text-red-400" /> COMBAT OPERATOR DOWN
            </>
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-3xl md:text-4xl font-black tracking-wider font-orbitron mb-1 ${
            victory ? 'text-cyan-400 neon-glow-cyan' : 'text-rose-500 neon-glow-red'
          }`}
        >
          {victory ? 'VICTORY' : 'DEFEATED'}
        </h2>

        <p className="text-sm text-slate-400 font-rajdhani mb-6">
          {victory
            ? 'Hostile robotic legions neutralized. Sector secured.'
            : 'Operational systems compromised in the hot zone.'}
        </p>

        {/* High Score Alert */}
        {isNewHighScore && (
          <div className="mb-6 py-2 px-4 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center gap-2 text-amber-300 font-orbitron text-xs font-bold tracking-wider animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400" /> NEW PERSONAL BEST RECORD!
          </div>
        )}

        {/* Stat Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-rajdhani">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-center">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> FINAL SCORE
            </div>
            <div className="text-2xl font-bold font-orbitron text-cyan-300 tabular-nums">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-center">
              <Skull className="w-3.5 h-3.5 text-rose-400" /> ROBOTS DESTROYED
            </div>
            <div className="text-2xl font-bold font-orbitron text-slate-100 tabular-nums">
              {stats.kills}
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-center">
              <Target className="w-3.5 h-3.5 text-amber-400" /> WEAPON ACCURACY
            </div>
            <div className="text-2xl font-bold font-orbitron text-amber-300 tabular-nums">
              {accuracy}%
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-center">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> SURVIVAL DURATION
            </div>
            <div className="text-2xl font-bold font-orbitron text-emerald-300 tabular-nums">
              {formatTime(stats.timeSurvived)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 font-orbitron text-sm">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/25"
          >
            <RotateCcw className="w-5 h-5" />
            DEPLOY AGAIN
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition font-bold"
          >
            <Home className="w-4 h-4" />
            RETURN TO COMMAND CENTER
          </button>
        </div>
      </div>
    </div>
  );
};

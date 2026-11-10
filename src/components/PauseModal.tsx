import React from 'react';
import { sound } from '../game/audio';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/70 rounded-xl p-6 shadow-2xl neon-border-cyan text-center">
        {/* Title */}
        <div className="mb-6">
          <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
            // SIMULATION SUSPENDED
          </span>
          <h2 className="text-3xl font-black tracking-wider font-orbitron text-slate-100 mt-1 neon-glow-cyan">
            MISSION PAUSED
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 font-orbitron text-sm">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/25"
          >
            <Play className="w-5 h-5 fill-current" />
            RESUME COMBAT
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 transition font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART MISSION
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 transition font-bold"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            SYSTEM SETTINGS
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onQuitToMenu();
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 transition font-bold"
          >
            <Home className="w-4 h-4" />
            ABORT TO MAIN MENU
          </button>
        </div>

        <div className="mt-6 text-xs text-slate-500 font-mono">
          Press ESC to resume at any time
        </div>
      </div>
    </div>
  );
};

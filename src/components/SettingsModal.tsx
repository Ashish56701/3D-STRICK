import React from 'react';
import { GameSettings } from '../game/types';
import { sound } from '../game/audio';
import { X, Volume2, Sun, Moon, Crosshair, Monitor } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleVolumeChange = (type: 'master' | 'sfx' | 'music', val: number) => {
    const updated = {
      ...settings,
      [`${type}Volume`]: val,
    };
    if (type === 'master') sound.masterVolume = val;
    if (type === 'sfx') sound.sfxVolume = val;
    if (type === 'music') sound.musicVolume = val;
    sound.updateVolumes();
    onUpdateSettings(updated);
  };

  const handleSensitivity = (val: number) => {
    onUpdateSettings({ ...settings, sensitivity: val });
  };

  const handleGraphics = (quality: 'low' | 'medium' | 'high') => {
    sound.playClick();
    onUpdateSettings({ ...settings, graphicsQuality: quality });
  };

  const toggleDayNight = () => {
    sound.playClick();
    onUpdateSettings({ ...settings, isDaytime: !settings.isDaytime });
  };

  const toggleInvertY = () => {
    sound.playClick();
    onUpdateSettings({ ...settings, invertY: !settings.invertY });
  };

  const toggleMinimap = () => {
    sound.playClick();
    onUpdateSettings({ ...settings, showMinimap: !settings.showMinimap });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-cyan-500/60 rounded-xl p-6 shadow-2xl neon-border-cyan text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <Crosshair className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-wider font-orbitron text-cyan-400">
              SYSTEM SETTINGS
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="py-4 space-y-5 text-sm font-rajdhani">
          {/* Graphics Quality */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold text-slate-300">
              <Monitor className="w-4 h-4 text-cyan-400" /> GRAPHICS FIDELITY
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleGraphics(q)}
                  className={`py-2 px-3 rounded font-bold uppercase transition ${
                    settings.graphicsQuality === q
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Volumes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-semibold text-slate-300">
              <Volume2 className="w-4 h-4 text-cyan-400" /> AUDIO MIXER
            </label>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Master Volume</span>
                <span className="tabular-nums font-bold text-cyan-400">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>SFX Volume</span>
                <span className="tabular-nums font-bold text-cyan-400">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Music Synth</span>
                <span className="tabular-nums font-bold text-cyan-400">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Aim Sensitivity */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">Aim Sensitivity</span>
              <span className="tabular-nums font-bold text-cyan-400">
                {settings.sensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={settings.sensitivity}
              onChange={(e) => handleSensitivity(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={toggleDayNight}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition text-xs font-semibold"
            >
              {settings.isDaytime ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" /> Day Atmosphere
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-cyan-400" /> Night Cyberpunk
                </>
              )}
            </button>

            <button
              onClick={toggleInvertY}
              className={`py-2.5 px-3 rounded border transition text-xs font-semibold ${
                settings.invertY
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Invert Pitch: {settings.invertY ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={toggleMinimap}
              className={`col-span-2 py-2 px-3 rounded border transition text-xs font-semibold ${
                settings.showMinimap
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Radar Tactical Minimap: {settings.showMinimap ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-700/80 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded font-orbitron font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
          >
            CONFIRM & RETURN
          </button>
        </div>
      </div>
    </div>
  );
};

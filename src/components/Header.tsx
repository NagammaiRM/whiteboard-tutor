// src/components/Header.tsx
// Global application header with provider router badge, shortcuts, and modal triggers
import React from 'react';
import { useTutorStore } from '../store/useTutorStore';
import {
  Sparkles,
  Command,
  Download,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Palette
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenExport,
  onOpenPalette
}) => {
  const { activeProvider, settings, setTheme } = useTutorStore();
  const isChalkboard = settings.theme === 'chalkboard';

  return (
    <header className="app-header h-14 px-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between select-none z-20">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[1.5px] shadow-lg shadow-sky-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm md:text-base text-white tracking-tight">
              Whiteboard Tutor
            </h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono font-medium">
              v2.0
            </span>
          </div>
        </div>

        {/* Live Provider Router Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">{activeProvider}</span>
          <span className="text-[10px] text-slate-400">• Free Tier</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette shortcut button */}
        <button
          onClick={onOpenPalette}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition-all"
          title="Command Palette (Cmd+K)"
        >
          <Command className="w-3.5 h-3.5 text-slate-400" />
          <span>Cmd+K</span>
        </button>

        {/* Theme quick switch */}
        <button
          onClick={() => setTheme(isChalkboard ? 'whiteboard' : 'chalkboard')}
          className={`p-2 rounded-lg border text-xs transition-all ${
            isChalkboard
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
          }`}
          title="Switch theme (Whiteboard / Chalkboard)"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Export Modal button */}
        <button
          onClick={onOpenExport}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-all"
          title="Export PNG, SVG, PDF or Session JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-all"
          title="Settings & API Secrets"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

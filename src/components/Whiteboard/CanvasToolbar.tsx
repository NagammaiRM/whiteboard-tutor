// src/components/Whiteboard/CanvasToolbar.tsx
// Top and bottom toolbar controls for whiteboard customization, replay, and annotation
import React from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import {
  PenTool,
  Grid,
  RotateCcw,
  Undo2,
  Trash2,
  Play,
  FastForward,
  Sparkles,
  Maximize2,
  FileText
} from 'lucide-react';

export const CanvasToolbar: React.FC = () => {
  const {
    settings,
    setTheme,
    setGridType,
    setSpeed,
    toggleWobble,
    replayTurn,
    skipAnimation,
    undoTurn,
    clearBoard,
    isAnnotationMode,
    setAnnotationMode,
    activeSourceId,
    turnHistory,
    commands,
    isReplaying,
    isGenerating
  } = useTutorStore();

  const isChalkboard = settings.theme === 'chalkboard';

  return (
    <div className="canvas-toolbar flex items-center justify-between px-3 py-2 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-xs select-none z-10">
      {/* Left controls: Modes & Annotation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setAnnotationMode(!isAnnotationMode)}
          disabled={!activeSourceId && !isAnnotationMode}
          className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
            isAnnotationMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50'
          } ${!activeSourceId && !isAnnotationMode ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={activeSourceId ? 'Toggle Annotation on active document page' : 'Upload or select a document first'}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isAnnotationMode ? 'Annotating PDF' : 'Annotate Mode'}</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1" />

        {/* Theme toggle: Whiteboard vs Chalkboard */}
        <button
          onClick={() => setTheme(isChalkboard ? 'whiteboard' : 'chalkboard')}
          className={`px-2 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
            isChalkboard
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
              : 'bg-slate-800 text-slate-200 border border-slate-700/60'
          }`}
          title="Toggle Whiteboard / Chalkboard theme"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isChalkboard ? 'Chalkboard' : 'Dry-Erase'}</span>
        </button>

        {/* Grid pattern picker */}
        <button
          onClick={() => {
            const types: ('none' | 'dots' | 'ruled' | 'grid')[] = ['none', 'dots', 'ruled', 'grid'];
            const next = types[(types.indexOf(settings.gridType) + 1) % types.length];
            setGridType(next);
          }}
          className="px-2 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 flex items-center gap-1.5 transition-all"
          title="Cycle grid: None / Dots / Ruled / Graph"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="capitalize">{settings.gridType}</span>
        </button>

        {/* Wobble tremor toggle */}
        <button
          onClick={toggleWobble}
          className={`px-2 py-1.5 rounded-md transition-all ${
            settings.enableWobble
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:bg-slate-800 border border-slate-700/50'
          }`}
          title="Toggle hand-drawn SVG turbulence wobble"
        >
          <span>Wobble</span>
        </button>
      </div>

      {/* Right controls: Playback, Speed, Undo, Clear */}
      <div className="flex items-center gap-1.5">
        {/* Speed button / slider */}
        <div className="flex items-center bg-slate-800/90 rounded-md border border-slate-700/60 p-0.5">
          {[0.5, 1, 2, 999].map(spd => (
            <button
              key={spd}
              onClick={() => setSpeed(spd)}
              className={`px-1.5 py-1 rounded text-[11px] font-medium transition-all ${
                settings.speed === spd
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd === 999 ? '⚡' : `${spd}×`}
            </button>
          ))}
        </div>

        {/* Replay */}
        <button
          onClick={replayTurn}
          disabled={commands.length === 0 || isReplaying || isGenerating}
          className="px-2 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 disabled:opacity-40 flex items-center gap-1 transition-all"
          title="Re-animate board stroke by stroke"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin' : ''}`} />
          <span>Replay</span>
        </button>

        {/* Skip Animation */}
        {(isReplaying || isGenerating) && (
          <button
            onClick={skipAnimation}
            className="px-2 py-1.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 hover:bg-amber-500/30 transition-all"
            title="Skip directly to finished board"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip</span>
          </button>
        )}

        {/* Undo turn */}
        <button
          onClick={undoTurn}
          disabled={turnHistory.length === 0}
          className="px-2 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 disabled:opacity-40 flex items-center gap-1 transition-all"
          title="Undo last turn (Cmd+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        {/* Clear Board */}
        <button
          onClick={clearBoard}
          disabled={commands.length === 0}
          className="px-2 py-1.5 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 disabled:opacity-40 flex items-center gap-1 transition-all"
          title="Clear the whiteboard canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};

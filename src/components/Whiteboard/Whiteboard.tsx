// src/components/Whiteboard/Whiteboard.tsx
// Core SVG Whiteboard Canvas with 1000x700 coordinate system, PDF annotation layer, and SVG filters
import React, { useRef } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { CanvasToolbar } from './CanvasToolbar';
import { HandwritingItem } from './HandwritingItem';
import { MathItem } from './MathItem';
import { ShapeItem } from './ShapeItem';
import { HighlightItem } from './HighlightItem';
import { NoteItem } from './NoteItem';
import { LaserPointer } from './LaserPointer';
import { Volume2 } from 'lucide-react';

export const Whiteboard: React.FC = () => {
  const {
    renderedCommands,
    boardBackground,
    settings,
    laserPosition,
    isGenerating,
    statusMessage,
    isAnnotationMode,
    activePageNumber
  } = useTutorStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const isChalkboard = settings.theme === 'chalkboard';

  return (
    <div className="whiteboard-container flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative select-none">
      {/* Top Toolbar */}
      <CanvasToolbar />

      {/* Main Board Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-slate-950/70">
        <div
          className={`board-frame relative w-full h-full max-w-[1200px] max-h-[840px] flex items-center justify-center rounded-xl overflow-hidden transition-all duration-300 shadow-2xl border ${
            isChalkboard
              ? 'bg-[#13221c] border-emerald-900/60 shadow-emerald-950/40'
              : 'bg-[#f8fafc] border-slate-300 shadow-slate-950/50'
          }`}
          style={{
            backgroundImage: isChalkboard
              ? 'radial-gradient(circle at 50% 50%, rgba(20, 45, 36, 0.95), rgba(10, 22, 17, 1))'
              : 'none'
          }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 1000 700"
            className="w-full h-full object-contain"
            id="whiteboard-svg"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            {/* SVG Filters Definition */}
            <defs>
              {/* Hand-drawn wobble filter */}
              <filter id="hand-wobble" x="-15%" y="-15%" width="130%" height="130%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency={settings.enableWobble ? '0.04' : '0.001'}
                  numOctaves="3"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={settings.enableWobble ? '2.4' : '0'}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>

              {/* Chalk dust texture filter */}
              <filter id="chalk-dust" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" result="dust" />
                <feDisplacementMap in="SourceGraphic" in2="dust" scale="1.6" />
              </filter>

              {/* Dot Grid Pattern */}
              <pattern id="grid-dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle
                  cx="15"
                  cy="15"
                  r="1.2"
                  fill={isChalkboard ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)'}
                />
              </pattern>

              {/* Ruled Lines Pattern */}
              <pattern id="grid-ruled" width="30" height="30" patternUnits="userSpaceOnUse">
                <line
                  x1="0"
                  y1="30"
                  x2="30"
                  y2="30"
                  stroke={isChalkboard ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.09)'}
                  strokeWidth="1"
                />
              </pattern>

              {/* Graph Paper Pattern */}
              <pattern id="grid-graph" width="25" height="25" patternUnits="userSpaceOnUse">
                <rect
                  width="25"
                  height="25"
                  fill="none"
                  stroke={isChalkboard ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.07)'}
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>

            {/* Background Grid Layer */}
            {settings.gridType === 'dots' && (
              <rect x="0" y="0" width="1000" height="700" fill="url(#grid-dots)" />
            )}
            {settings.gridType === 'ruled' && (
              <rect x="0" y="0" width="1000" height="700" fill="url(#grid-ruled)" />
            )}
            {settings.gridType === 'grid' && (
              <rect x="0" y="0" width="1000" height="700" fill="url(#grid-graph)" />
            )}

            {/* Document PDF Background in Annotation Mode */}
            {isAnnotationMode && boardBackground?.dataUrl && (
              <g className="document-bg-layer" opacity="0.94">
                <image
                  href={boardBackground.dataUrl}
                  x="40"
                  y="20"
                  width="920"
                  height="660"
                  preserveAspectRatio="xMidYMid meet"
                />
                {/* Page indicator watermark */}
                <rect x="45" y="25" width="140" height="26" rx="4" fill="rgba(15, 23, 42, 0.75)" />
                <text x="55" y="42" fill="#38bdf8" fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
                  Page {activePageNumber} Overlay
                </text>
              </g>
            )}

            {/* Drawing Commands Layer */}
            {renderedCommands.map((cmd, idx) => {
              if (cmd.type === 'write') {
                return (
                  <HandwritingItem
                    key={cmd.id || idx}
                    text={cmd.text}
                    x={cmd.x}
                    y={cmd.y}
                    size={cmd.size}
                    font={cmd.font || settings.handFont}
                    color={cmd.color}
                    isChalkboard={isChalkboard}
                  />
                );
              }

              if (cmd.type === 'math') {
                return (
                  <MathItem
                    key={cmd.id || idx}
                    tex={cmd.tex}
                    x={cmd.x}
                    y={cmd.y}
                    size={cmd.size}
                    color={cmd.color}
                    isChalkboard={isChalkboard}
                  />
                );
              }

              if (cmd.type === 'highlight') {
                return (
                  <HighlightItem
                    key={cmd.id || idx}
                    x={cmd.x}
                    y={cmd.y}
                    w={cmd.w}
                    h={cmd.h}
                    color={cmd.color}
                    isChalkboard={isChalkboard}
                  />
                );
              }

              if (cmd.type === 'note') {
                return (
                  <NoteItem
                    key={cmd.id || idx}
                    text={cmd.text}
                    x={cmd.x}
                    y={cmd.y}
                    size={cmd.size}
                    color={cmd.color}
                    isChalkboard={isChalkboard}
                  />
                );
              }

              return <ShapeItem key={idx} cmd={cmd} isChalkboard={isChalkboard} />;
            })}

            {/* Live Tutor Laser Pointer / Pen Nib */}
            {laserPosition && (
              <LaserPointer x={laserPosition.x} y={laserPosition.y} isChalkboard={isChalkboard} />
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Board Status Bar */}
      <div className="board-status-bar h-8 px-4 flex items-center justify-between border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          ) : (
            <span className="text-slate-400">{renderedCommands.length} visual items rendered</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Voice Narration: {settings.enableTTS ? 'Active' : 'Muted'}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">1000 × 700 Canvas</span>
        </div>
      </div>
    </div>
  );
};

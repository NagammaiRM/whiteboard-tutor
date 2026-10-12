// src/components/Whiteboard/NoteItem.tsx
// Sticky margin note with tape header, drop shadow, and cursive handwriting
import React from 'react';

interface NoteItemProps {
  text: string;
  x: number;
  y: number;
  size?: number;
  color?: string;
  isChalkboard?: boolean;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  text,
  x,
  y,
  size = 20,
  color,
  isChalkboard = false
}) => {
  const noteBg = isChalkboard ? '#1f2937' : '#fef9c3';
  const textColor = isChalkboard ? '#fef08a' : '#854d0e';
  const borderColor = isChalkboard ? '#374151' : '#fef08a';

  // Estimate dimensions based on text length
  const width = Math.min(220, Math.max(160, text.length * 8));
  const height = Math.max(80, Math.ceil(text.length / 22) * 26 + 35);

  return (
    <g transform={`translate(${x}, ${y})`} filter="url(#hand-wobble)" className="note-container">
      {/* Tape strip at top */}
      <rect
        x={width / 2 - 25}
        y={-8}
        width={50}
        height={16}
        fill={isChalkboard ? 'rgba(255, 255, 255, 0.15)' : 'rgba(254, 240, 138, 0.7)'}
        rx={2}
        style={{ transform: 'rotate(-2deg)' }}
      />

      {/* Note paper body */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={6}
        fill={noteBg}
        stroke={borderColor}
        strokeWidth={1}
        filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))"
      />

      {/* Note text content */}
      <foreignObject x={10} y={10} width={width - 20} height={height - 20}>
        <div
          style={{
            fontFamily: "'Caveat', cursive, sans-serif",
            fontSize: `${size}px`,
            color: textColor,
            lineHeight: 1.25,
            fontWeight: 600,
            overflow: 'hidden',
            wordBreak: 'break-word',
            userSelect: 'none'
          }}
        >
          📌 {text}
        </div>
      </foreignObject>
    </g>
  );
};

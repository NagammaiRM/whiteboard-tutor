// src/components/Whiteboard/HighlightItem.tsx
// Semi-transparent highlighter marker on whiteboard and PDF text
import React from 'react';

interface HighlightItemProps {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  isChalkboard?: boolean;
}

export const HighlightItem: React.FC<HighlightItemProps> = ({
  x,
  y,
  w,
  h,
  color,
  isChalkboard = false
}) => {
  const highlightColor = color || (isChalkboard ? '#fde047' : '#fef08a');
  const opacity = isChalkboard ? 0.35 : 0.45;

  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={4}
      ry={4}
      fill={highlightColor}
      opacity={opacity}
      filter="url(#hand-wobble)"
      style={{
        mixBlendMode: isChalkboard ? 'screen' : 'multiply',
        animation: 'fadeIn 0.25s ease-out'
      }}
    />
  );
};

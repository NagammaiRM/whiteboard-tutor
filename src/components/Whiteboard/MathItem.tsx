// src/components/Whiteboard/MathItem.tsx
// KaTeX math formula renderer encased in hand-drawn SVG container
import React, { useMemo } from 'react';
import katex from 'katex';

interface MathItemProps {
  tex: string;
  x: number;
  y: number;
  size?: number;
  color?: string;
  isChalkboard?: boolean;
}

export const MathItem: React.FC<MathItemProps> = ({
  tex,
  x,
  y,
  size = 32,
  color,
  isChalkboard = false
}) => {
  const mathColor = color || (isChalkboard ? '#fef08a' : '#1e3a8a');

  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<span>${tex}</span>`;
    }
  }, [tex]);

  const width = Math.max(200, tex.length * 16);
  const height = Math.max(70, size * 2.2);

  return (
    <foreignObject
      x={x}
      y={y - height / 2 + 10}
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <div
        style={{
          color: mathColor,
          fontSize: `${size}px`,
          fontFamily: 'KaTeX_Main, Times New Roman, serif',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px',
          background: isChalkboard ? 'rgba(255, 255, 255, 0.04)' : 'rgba(238, 242, 255, 0.6)',
          borderRadius: '8px',
          border: isChalkboard ? '1px dashed rgba(254, 240, 138, 0.3)' : '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: isChalkboard ? 'none' : '0 2px 6px rgba(0,0,0,0.05)',
          userSelect: 'none',
          animation: 'fadeInScale 0.35s ease-out'
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </foreignObject>
  );
};

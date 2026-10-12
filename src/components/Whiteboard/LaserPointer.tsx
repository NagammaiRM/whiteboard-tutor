// src/components/Whiteboard/LaserPointer.tsx
// Animated tutor pen nib and glowing laser pointer following live drawing commands
import React from 'react';

interface LaserPointerProps {
  x: number;
  y: number;
  isChalkboard?: boolean;
}

export const LaserPointer: React.FC<LaserPointerProps> = ({ x, y, isChalkboard = false }) => {
  return (
    <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none', transition: 'transform 0.08s ease-out' }}>
      {/* Outer pulsing halo */}
      <circle
        r={14}
        fill={isChalkboard ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.25)'}
        className="laser-pulse"
      />
      {/* Inner sharp laser point */}
      <circle
        r={4}
        fill={isChalkboard ? '#38bdf8' : '#ef4444'}
      />
      {/* Pen nib illustration */}
      <path
        d="M 0 0 L 12 -24 L 20 -20 L 4 -2 Z"
        fill={isChalkboard ? '#f8fafc' : '#334155'}
        stroke={isChalkboard ? '#38bdf8' : '#e2e8f0'}
        strokeWidth={1}
      />
    </g>
  );
};

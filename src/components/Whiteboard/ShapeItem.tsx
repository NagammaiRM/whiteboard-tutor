// src/components/Whiteboard/ShapeItem.tsx
// Geometric shapes, lines, arrows, and paths with stroke-dashoffset drawing animation
import React from 'react';
import type { DrawCommand } from '../../types/tutor';

interface ShapeItemProps {
  cmd: DrawCommand;
  isChalkboard?: boolean;
}

export const ShapeItem: React.FC<ShapeItemProps> = ({ cmd, isChalkboard = false }) => {
  const defaultStroke = isChalkboard ? '#f1f5f9' : '#1e293b';

  if (cmd.type === 'line') {
    return (
      <line
        x1={cmd.x1}
        y1={cmd.y1}
        x2={cmd.x2}
        y2={cmd.y2}
        stroke={cmd.color || defaultStroke}
        strokeWidth={cmd.width || 3}
        strokeLinecap="round"
        filter="url(#hand-wobble)"
        className="stroke-animated"
      />
    );
  }

  if (cmd.type === 'arrow') {
    // Calculate angle for arrowhead
    const dx = cmd.x2 - cmd.x1;
    const dy = cmd.y2 - cmd.y1;
    const angle = Math.atan2(dy, dx);
    const headLen = 14;

    const xArrow1 = cmd.x2 - headLen * Math.cos(angle - Math.PI / 6);
    const yArrow1 = cmd.y2 - headLen * Math.sin(angle - Math.PI / 6);
    const xArrow2 = cmd.x2 - headLen * Math.cos(angle + Math.PI / 6);
    const yArrow2 = cmd.y2 - headLen * Math.sin(angle + Math.PI / 6);

    const strokeColor = cmd.color || (isChalkboard ? '#38bdf8' : '#2563eb');

    return (
      <g filter="url(#hand-wobble)">
        <line
          x1={cmd.x1}
          y1={cmd.y1}
          x2={cmd.x2}
          y2={cmd.y2}
          stroke={strokeColor}
          strokeWidth={cmd.width || 3}
          strokeLinecap="round"
          className="stroke-animated"
        />
        <polygon
          points={`${cmd.x2},${cmd.y2} ${xArrow1},${yArrow1} ${xArrow2},${yArrow2}`}
          fill={strokeColor}
        />
      </g>
    );
  }

  if (cmd.type === 'rect') {
    return (
      <rect
        x={cmd.x}
        y={cmd.y}
        width={cmd.w}
        height={cmd.h}
        rx={6}
        ry={6}
        stroke={cmd.color || (isChalkboard ? '#818cf8' : '#4f46e5')}
        strokeWidth={cmd.width || 2.5}
        fill={cmd.fill || (isChalkboard ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.04)')}
        filter="url(#hand-wobble)"
        strokeLinejoin="round"
        className="stroke-animated"
      />
    );
  }

  if (cmd.type === 'circle') {
    return (
      <circle
        cx={cmd.cx}
        cy={cmd.cy}
        r={cmd.r}
        stroke={cmd.color || (isChalkboard ? '#f472b6' : '#db2777')}
        strokeWidth={cmd.width || 2.5}
        fill={cmd.fill || (isChalkboard ? 'rgba(244, 114, 182, 0.05)' : 'rgba(219, 39, 119, 0.05)')}
        filter="url(#hand-wobble)"
        className="stroke-animated"
      />
    );
  }

  if (cmd.type === 'dot') {
    return (
      <circle
        cx={cmd.cx}
        cy={cmd.cy}
        r={cmd.r}
        fill={cmd.color || (isChalkboard ? '#f43f5e' : '#e11d48')}
        filter="url(#hand-wobble)"
      />
    );
  }

  if (cmd.type === 'underline') {
    return (
      <path
        d={`M ${cmd.x1} ${cmd.y2} Q ${(cmd.x1 + cmd.x2) / 2} ${cmd.y2 + 3} ${cmd.x2} ${cmd.y2}`}
        stroke={cmd.color || '#ef4444'}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        filter="url(#hand-wobble)"
        className="stroke-animated"
      />
    );
  }

  if (cmd.type === 'polygon') {
    const pointsStr = cmd.points.map(p => `${p[0]},${p[1]}`).join(' ');
    return (
      <polygon
        points={pointsStr}
        stroke={cmd.color || (isChalkboard ? '#34d399' : '#059669')}
        strokeWidth={cmd.width || 2.5}
        fill={cmd.fill || (isChalkboard ? 'rgba(52, 211, 153, 0.08)' : 'rgba(5, 150, 105, 0.06)')}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#hand-wobble)"
        className="stroke-animated"
      />
    );
  }

  if (cmd.type === 'path') {
    return (
      <path
        d={cmd.d}
        stroke={cmd.color || (isChalkboard ? '#c084fc' : '#7c3aed')}
        strokeWidth={cmd.width || 3}
        fill={cmd.fill || 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#hand-wobble)"
        className="stroke-animated"
      />
    );
  }

  return null;
};

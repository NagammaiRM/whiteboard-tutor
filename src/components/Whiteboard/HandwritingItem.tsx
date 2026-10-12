// src/components/Whiteboard/HandwritingItem.tsx
// Animated handwriting renderer with cursive font styling and stroke appearance
import React, { useState, useEffect } from 'react';

interface HandwritingItemProps {
  text: string;
  x: number;
  y: number;
  size?: number;
  font?: string;
  color?: string;
  isChalkboard?: boolean;
}

export const HandwritingItem: React.FC<HandwritingItemProps> = ({
  text,
  x,
  y,
  size = 28,
  font = 'caveat',
  color,
  isChalkboard = false
}) => {
  const [displayedLength, setDisplayedLength] = useState(0);

  // Default color depending on chalkboard or whiteboard
  const textColor = color || (isChalkboard ? '#f8fafc' : '#0f172a');
  const fontFamily = font === 'amiri'
    ? "'Amiri', serif"
    : font === 'klee-one'
    ? "'Klee One', cursive"
    : font === 'kalam'
    ? "'Kalam', cursive"
    : "'Caveat', cursive, sans-serif";

  useEffect(() => {
    // Handwriting typewriter stroke reveal effect
    let current = 0;
    const total = text.length;
    const stepTime = Math.max(15, Math.min(45, 800 / total));

    const timer = setInterval(() => {
      current++;
      setDisplayedLength(current);
      if (current >= total) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [text]);

  const visibleText = text.slice(0, displayedLength);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <text
        x={0}
        y={0}
        fill={textColor}
        fontSize={size}
        fontFamily={fontFamily}
        fontWeight="600"
        letterSpacing="0.5px"
        filter={isChalkboard ? 'url(#chalk-dust)' : 'url(#hand-wobble)'}
        style={{
          textShadow: isChalkboard ? '0 0 1px rgba(255,255,255,0.4)' : 'none',
          userSelect: 'none'
        }}
      >
        {visibleText}
      </text>
    </g>
  );
};

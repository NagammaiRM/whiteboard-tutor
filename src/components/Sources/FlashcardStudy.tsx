// src/components/Sources/FlashcardStudy.tsx
// Spaced repetition flashcards with flip card animation and self-testing
import React, { useState } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { Layers, RotateCcw, Plus, Check, ChevronRight } from 'lucide-react';
import type { Flashcard } from '../../types/tutor';

export const FlashcardStudy: React.FC = () => {
  const { flashcards } = useTutorStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);

  const card = flashcards[currentIdx] || flashcards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setStudiedCount(prev => prev + 1);
    setCurrentIdx((prev) => (prev + 1) % (flashcards.length || 1));
  };

  return (
    <div className="flashcards-tool flex-1 flex flex-col h-full overflow-hidden text-xs bg-slate-950/40">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-300">Spaced Repetition Flashcards</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Card {currentIdx + 1} of {flashcards.length}
        </span>
      </div>

      {/* Main Flashcard Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {card ? (
          <div className="w-full max-w-[340px] space-y-4">
            {/* 3D Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-56 rounded-2xl p-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 shadow-xl flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-300 hover:border-amber-500/40"
            >
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-2">
                {isFlipped ? '💡 Answer' : '❓ Question (Click to Reveal)'}
              </span>

              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                {isFlipped ? card.answer : card.question}
              </p>

              <span className="mt-4 text-[10px] text-slate-400">
                {isFlipped ? 'Tap to flip back' : 'Tap to reveal answer'}
              </span>
            </div>

            {/* Spaced Repetition Buttons */}
            {isFlipped && (
              <div className="grid grid-cols-3 gap-2 animate-fadeIn">
                <button
                  onClick={handleNext}
                  className="py-2 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800/60 hover:bg-rose-900 text-[11px] font-semibold"
                >
                  Hard
                </button>
                <button
                  onClick={handleNext}
                  className="py-2 rounded-lg bg-sky-950/80 text-sky-300 border border-sky-800/60 hover:bg-sky-900 text-[11px] font-semibold"
                >
                  Good
                </button>
                <button
                  onClick={handleNext}
                  className="py-2 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 text-[11px] font-semibold"
                >
                  Easy
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-400 text-center">
            <p>No flashcards created yet.</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-2.5 border-t border-slate-800 text-[10px] text-slate-400 text-center">
        Cards reviewed in this session: <span className="text-sky-400 font-bold">{studiedCount}</span>
      </div>
    </div>
  );
};

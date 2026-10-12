// src/components/Chat/SuggestedPrompts.tsx
// Quick-start lesson chips for instant visual whiteboard demonstrations
import React from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { Sparkles, Calculator, Cpu, Leaf, BookOpen } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Pythagorean Theorem', icon: Calculator, query: 'Explain the Pythagorean theorem with a triangle and proof formula.' },
  { label: 'Neural Networks', icon: Cpu, query: 'Draw the architecture of an artificial neural network with weights and activation formula.' },
  { label: 'Calculus: Derivatives', icon: Calculator, query: 'Explain derivatives in calculus, the tangent slope, and the limit definition formula.' },
  { label: 'Photosynthesis', icon: Leaf, query: 'Illustrate the photosynthesis process, leaf chloroplast, and chemical equation.' },
  { label: 'Kant Categorical Imperative', icon: BookOpen, query: 'Explain Kant categorical imperative from the Critique with moral maxims.' }
];

export const SuggestedPrompts: React.FC = () => {
  const { sendMessage, isGenerating } = useTutorStore();

  return (
    <div className="suggested-prompts p-3 bg-slate-900/30 border-b border-slate-800/60">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span>Try an interactive lesson</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => sendMessage(item.query)}
              disabled={isGenerating}
              className="shine-hover hover-lift px-2.5 py-1 rounded-full text-xs bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-sky-300 border border-slate-700/60 hover:border-sky-500/40 transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <Icon className="w-3 h-3 text-sky-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// src/components/Sources/AudioOverviewModal.tsx
// NotebookLM-style 2-Host conversational podcast player with synchronized speech and animated waveforms
import React, { useState, useEffect } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { audioService, PodcastTurn } from '../../services/audioService';
import { Play, Pause, RotateCcw, Headphones, Radio, Sparkles } from 'lucide-react';

export const AudioOverviewModal: React.FC = () => {
  const { messages, sources } = useTutorStore();
  const lastTopic = messages[messages.length - 1]?.content || 'Visual Whiteboard Foundations';

  const [script, setScript] = useState<PodcastTurn[]>(() =>
    audioService.generatePodcastScript(lastTopic, sources[0]?.text)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);

  const handleRegenerate = () => {
    audioService.stop();
    setIsPlaying(false);
    setCurrentTurnIdx(0);
    const newScript = audioService.generatePodcastScript(lastTopic, sources[0]?.text);
    setScript(newScript);
  };

  const playTurn = (idx: number) => {
    if (idx >= script.length) {
      setIsPlaying(false);
      setCurrentTurnIdx(0);
      return;
    }

    setCurrentTurnIdx(idx);
    setIsPlaying(true);
    const turn = script[idx];

    // Pitch and rate differentiation between Alex and Morgan
    const isMorgan = turn.speaker === 'Morgan';
    audioService.speak(turn.text, {
      pitch: isMorgan ? 1.2 : 0.95,
      rate: isMorgan ? 1.08 : 1.02,
      onEnd: () => {
        playTurn(idx + 1);
      }
    });
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
    } else {
      playTurn(currentTurnIdx);
    }
  };

  const handleRestart = () => {
    audioService.stop();
    setCurrentTurnIdx(0);
    playTurn(0);
  };

  useEffect(() => {
    return () => {
      audioService.stop();
    };
  }, []);

  return (
    <div className="audio-overview flex-1 flex flex-col h-full overflow-hidden text-xs bg-slate-950/60">
      {/* Top Banner */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200">Audio Overview</h3>
            <p className="text-[10px] text-slate-400">NotebookLM-style 2-Host Deep Dive</p>
          </div>
        </div>

        <button
          onClick={handleRegenerate}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 flex items-center gap-1 text-[11px]"
        >
          <Sparkles className="w-3 h-3" />
          <span>Regenerate</span>
        </button>
      </div>

      {/* Host Avatars Visualizer */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-around">
        {/* Host 1: Alex */}
        <div className={`flex flex-col items-center gap-1.5 transition-all ${
          isPlaying && script[currentTurnIdx]?.speaker === 'Alex' ? 'scale-105 opacity-100' : 'opacity-70'
        }`}>
          <div className="w-12 h-12 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-300 font-bold text-base shadow-lg shadow-sky-500/20">
            A
          </div>
          <span className="font-semibold text-slate-200">Alex</span>
          <span className="text-[10px] text-sky-400">Host (Analyst)</span>
          {isPlaying && script[currentTurnIdx]?.speaker === 'Alex' && (
            <div className="flex items-center gap-0.5 h-3 mt-0.5">
              <span className="w-1 h-3 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1 h-2 bg-sky-400 rounded-full animate-bounce" />
              <span className="w-1 h-4 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.4s]" />
            </div>
          )}
        </div>

        {/* Center Control */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={handleRestart}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Restart Podcast from beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Turn {currentTurnIdx + 1} of {script.length}
          </span>
        </div>

        {/* Host 2: Morgan */}
        <div className={`flex flex-col items-center gap-1.5 transition-all ${
          isPlaying && script[currentTurnIdx]?.speaker === 'Morgan' ? 'scale-105 opacity-100' : 'opacity-70'
        }`}>
          <div className="w-12 h-12 rounded-full bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center text-pink-300 font-bold text-base shadow-lg shadow-pink-500/20">
            M
          </div>
          <span className="font-semibold text-slate-200">Morgan</span>
          <span className="text-[10px] text-pink-400">Host (Pedagogy)</span>
          {isPlaying && script[currentTurnIdx]?.speaker === 'Morgan' && (
            <div className="flex items-center gap-0.5 h-3 mt-0.5">
              <span className="w-1 h-4 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-2 bg-pink-400 rounded-full animate-bounce" />
              <span className="w-1 h-3 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Transcript */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {script.map((turn, idx) => {
          const isActive = isPlaying && currentTurnIdx === idx;
          const isAlex = turn.speaker === 'Alex';

          return (
            <div
              key={idx}
              onClick={() => playTurn(idx)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <span className={isAlex ? 'text-sky-400' : 'text-pink-400'}>
                  {turn.speaker}:
                </span>
                {isActive && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Speaking now
                  </span>
                )}
              </div>
              <p className="leading-relaxed text-xs">{turn.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

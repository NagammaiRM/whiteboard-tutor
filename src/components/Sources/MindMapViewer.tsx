// src/components/Sources/MindMapViewer.tsx
// Concept mind map generator with interactive node tree and "Draw on Whiteboard" execution
import React, { useState } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { generateMindMapFromTopic, convertMindMapToDrawCommands } from '../../services/mindMapService';
import { Network, Sparkles, PenTool, Plus } from 'lucide-react';
import type { MindMapNode } from '../../types/tutor';

export const MindMapViewer: React.FC = () => {
  const { messages, addCommand, clearBoard } = useTutorStore();
  const lastTopic = messages[messages.length - 1]?.content || 'Visual Concept Synthesis';

  const [topic, setTopic] = useState(lastTopic.slice(0, 32));
  const [mindMap, setMindMap] = useState<MindMapNode>(() => generateMindMapFromTopic(topic));

  const handleGenerate = () => {
    const map = generateMindMapFromTopic(topic);
    setMindMap(map);
  };

  const handleDrawOnWhiteboard = () => {
    clearBoard();
    const commands = convertMindMapToDrawCommands(mindMap);
    commands.forEach((cmd, idx) => {
      setTimeout(() => {
        addCommand(cmd);
      }, idx * 120);
    });
  };

  return (
    <div className="mindmap-viewer flex-1 flex flex-col h-full overflow-hidden text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Network className="w-3.5 h-3.5 text-sky-400" />
            <span>Mind Map Generator</span>
          </div>
          <button
            onClick={handleDrawOnWhiteboard}
            className="px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 flex items-center gap-1.5 font-medium transition-all"
          >
            <PenTool className="w-3 h-3" />
            <span>Draw on Whiteboard</span>
          </button>
        </div>

        {/* Topic Input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic to map out (e.g. Calculus, Kant)..."
            className="flex-1 bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-slate-200 outline-none"
          />
          <button
            onClick={handleGenerate}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Visual Tree View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/40">
        {/* Root Node */}
        <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-600/50 text-sky-200 font-bold text-center shadow-lg shadow-sky-950/30">
          🧠 {mindMap.topic}
        </div>

        {/* Branches */}
        <div className="space-y-3 pl-3 border-l-2 border-slate-800">
          {mindMap.children?.map((branch, bIdx) => (
            <div key={bIdx} className="space-y-2">
              <div
                className="p-2 rounded-lg border font-semibold flex items-center justify-between"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  borderColor: branch.color || '#60a5fa',
                  color: branch.color || '#93c5fd'
                }}
              >
                <span>▸ {branch.topic}</span>
              </div>

              {/* Sub-branches */}
              <div className="pl-4 space-y-1.5 border-l border-slate-800">
                {branch.children?.map((sub, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-1.5 rounded bg-slate-900 border border-slate-800/80 text-slate-300 text-[11px]"
                  >
                    • {sub.topic}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

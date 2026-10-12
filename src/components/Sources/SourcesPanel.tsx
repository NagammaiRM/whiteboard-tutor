// src/components/Sources/SourcesPanel.tsx
// Right panel: Tabbed hub for Documents & Grounding, Notes, Mind Maps, Audio Overview, and Flashcards
import React, { useState } from 'react';
import { DocumentViewer } from './DocumentViewer';
import { NotesManager } from './NotesManager';
import { MindMapViewer } from './MindMapViewer';
import { AudioOverviewModal } from './AudioOverviewModal';
import { FlashcardStudy } from './FlashcardStudy';
import { FileText, Bookmark, Network, Radio, Layers } from 'lucide-react';

type TabKey = 'docs' | 'notes' | 'mindmap' | 'audio' | 'flashcards';

export const SourcesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('docs');

  return (
    <div className="sources-panel w-80 md:w-96 flex flex-col h-full bg-slate-900 border-l border-slate-800 z-10">
      {/* Tab Navigation Header */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/80 px-2 py-1.5 gap-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
            activeTab === 'docs'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Documents & Grounded RAG"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Docs</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
            activeTab === 'notes'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Study Notes & Pinned Lessons"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('mindmap')}
          className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
            activeTab === 'mindmap'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Mind Map Generator"
        >
          <Network className="w-3.5 h-3.5" />
          <span>Mind Map</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
            activeTab === 'audio'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="2-Host Audio Overview Podcast"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Podcast</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
            activeTab === 'flashcards'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Spaced Repetition Flashcards"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
      </div>

      {/* Active Tab View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeTab === 'docs' && <DocumentViewer />}
        {activeTab === 'notes' && <NotesManager />}
        {activeTab === 'mindmap' && <MindMapViewer />}
        {activeTab === 'audio' && <AudioOverviewModal />}
        {activeTab === 'flashcards' && <FlashcardStudy />}
      </div>
    </div>
  );
};

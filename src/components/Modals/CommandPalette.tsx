// src/components/Modals/CommandPalette.tsx
// Cmd+K Spotlight Command Palette for rapid keyboard navigation and quick actions
import React, { useState, useEffect } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import {
  Search,
  Sparkles,
  PenTool,
  RotateCcw,
  Undo2,
  Trash2,
  Radio,
  Network,
  Download,
  Settings,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenExport
}) => {
  const {
    createNewSession,
    clearBoard,
    replayTurn,
    undoTurn,
    setTheme,
    settings,
    setAnnotationMode,
    isAnnotationMode
  } = useTutorStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'new_session',
      title: 'New Whiteboard Session',
      category: 'General',
      icon: Sparkles,
      run: () => { createNewSession(); onClose(); }
    },
    {
      id: 'toggle_chalkboard',
      title: settings.theme === 'chalkboard' ? 'Switch to Whiteboard Theme' : 'Switch to Chalkboard Theme',
      category: 'Theme',
      icon: Sparkles,
      run: () => { setTheme(settings.theme === 'chalkboard' ? 'whiteboard' : 'chalkboard'); onClose(); }
    },
    {
      id: 'toggle_annotate',
      title: isAnnotationMode ? 'Exit Annotation Mode' : 'Enter PDF Annotation Mode',
      category: 'Drawing',
      icon: PenTool,
      run: () => { setAnnotationMode(!isAnnotationMode); onClose(); }
    },
    {
      id: 'replay_board',
      title: 'Replay Board Stroke-by-Stroke',
      category: 'Drawing',
      icon: RotateCcw,
      run: () => { replayTurn(); onClose(); }
    },
    {
      id: 'undo_turn',
      title: 'Undo Last Turn (Cmd+Z)',
      category: 'Drawing',
      icon: Undo2,
      run: () => { undoTurn(); onClose(); }
    },
    {
      id: 'clear_board',
      title: 'Clear Whiteboard Canvas',
      category: 'Drawing',
      icon: Trash2,
      run: () => { clearBoard(); onClose(); }
    },
    {
      id: 'export_lesson',
      title: 'Export Whiteboard (PNG, SVG, PDF)',
      category: 'Export',
      icon: Download,
      run: () => { onClose(); onOpenExport(); }
    },
    {
      id: 'open_settings',
      title: 'Configure LLM Keys & Preferences',
      category: 'Settings',
      icon: Settings,
      run: () => { onClose(); onOpenSettings(); }
    }
  ];

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Search input bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-2.5 bg-slate-950">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search action (e.g. 'theme', 'clear', 'export')..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Action list */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1 custom-scrollbar text-xs">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No matching commands found</div>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.run}
                  className="w-full p-2.5 rounded-lg hover:bg-slate-800 text-left flex items-center justify-between text-slate-200 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-slate-800 group-hover:bg-sky-500/20 text-slate-400 group-hover:text-sky-400 flex items-center justify-center transition-all">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{action.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{action.category}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

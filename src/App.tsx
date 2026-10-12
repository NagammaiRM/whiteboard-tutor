// src/App.tsx
// Main application layout with 3-panel architecture, global shortcuts, and modal management
import React, { useState, useEffect } from 'react';
import { useTutorStore } from './store/useTutorStore';
import { Header } from './components/Header';
import { ChatPanel } from './components/Chat/ChatPanel';
import { Whiteboard } from './components/Whiteboard/Whiteboard';
import { SourcesPanel } from './components/Sources/SourcesPanel';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ExportModal } from './components/Modals/ExportModal';
import { CommandPalette } from './components/Modals/CommandPalette';

export const App: React.FC = () => {
  const { init, undoTurn, skipAnimation } = useTutorStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Initialize storage on load
  useEffect(() => {
    init();
  }, [init]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      // Cmd+Z or Ctrl+Z -> Undo Turn
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        // Prevent default if not typing in input/textarea
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          undoTurn();
        }
      }
      // Esc -> Skip Drawing Animation
      else if (e.key === 'Escape') {
        skipAnimation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoTurn, skipAnimation]);

  return (
    <div className="whiteboard-app flex flex-col h-full w-full overflow-hidden text-slate-100 relative">
      {/* Ambient animated aurora backdrop */}
      <div className="aurora-layer">
        <div className="aurora-blob-3" />
        <div className="grain-overlay" />
        <div className="vignette" />
      </div>

      {/* Top Header */}
      <div className="relative z-10">
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenPalette={() => setIsPaletteOpen(true)}
        />
      </div>

      {/* Main 3-Panel Workspace */}
      <main className="flex-1 flex flex-row overflow-hidden relative z-10">
        {/* Left: Chat & Voice */}
        <ChatPanel />

        {/* Center: The Whiteboard */}
        <Whiteboard />

        {/* Right: Sources & Study Hub */}
        <SourcesPanel />
      </main>

      {/* Modals & Dialogs */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />
    </div>
  );
};

export default App;

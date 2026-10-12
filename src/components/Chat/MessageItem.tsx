// src/components/Chat/MessageItem.tsx
// Chat message card with smart citations, audio TTS playback, and pin-to-notes action
import React from 'react';
import type { Message } from '../../types/tutor';
import { useTutorStore } from '../../store/useTutorStore';
import { audioService } from '../../services/audioService';
import { Volume2, Bookmark, Check, Bot, User } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { pinMessageToNote, setActiveSource, setActivePage, setAnnotationMode } = useTutorStore();
  const isAssistant = message.role === 'assistant';

  const handleSpeak = () => {
    if (message.spokenText || message.content) {
      audioService.speak(message.spokenText || message.content);
    }
  };

  const handleCitationClick = (page?: number, sourceId?: string) => {
    if (sourceId) {
      setActiveSource(sourceId);
    }
    if (page) {
      setActivePage(page);
      setAnnotationMode(true);
    }
  };

  return (
    <div
      className={`message-card p-3.5 rounded-xl transition-all ${
        isAssistant
          ? 'bg-slate-900/90 border border-slate-800 text-slate-100 shadow-sm'
          : 'bg-indigo-950/40 border border-indigo-900/50 text-indigo-100 ml-4'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isAssistant ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-indigo-500/20 text-indigo-300'
            }`}
          >
            {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          </div>
          <span className="text-xs font-semibold text-slate-300">
            {isAssistant ? 'Whiteboard Tutor' : 'You'}
          </span>
        </div>

        {isAssistant && (
          <div className="flex items-center gap-1">
            {/* Read aloud TTS button */}
            <button
              onClick={handleSpeak}
              className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-all"
              title="Read lesson narration aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            {/* Pin to Notes */}
            <button
              onClick={() => pinMessageToNote(message.id)}
              className={`p-1 rounded transition-all ${
                message.isPinned
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
              }`}
              title="Pin this lesson to study notes"
            >
              {message.isPinned ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
        {message.content || (isAssistant ? 'Drawing lesson on the board...' : '')}
      </div>

      {/* Grounded Smart Citations */}
      {message.citations && message.citations.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-sky-400 mb-1.5 flex items-center gap-1">
            <span>Verified Source Citations:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {message.citations.map((c, i) => (
              <button
                key={i}
                onClick={() => handleCitationClick(c.page, c.sourceId)}
                className="px-2 py-0.5 rounded text-[11px] bg-sky-950/70 border border-sky-800/60 text-sky-300 hover:bg-sky-900/60 transition-all flex items-center gap-1"
                title={`Quote: "${c.quote}" (Page ${c.page || 1})`}
              >
                <span className="font-mono font-bold">[{c.i}]</span>
                <span className="truncate max-w-[140px]">
                  {c.quote ? `"${c.quote.slice(0, 20)}..."` : `Page ${c.page || 1}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Commands Summary Badge */}
      {message.commands && message.commands.length > 0 && (
        <div className="mt-2 text-[10px] text-slate-400 font-mono">
          <span>{message.commands.length} whiteboard operations</span>
        </div>
      )}
    </div>
  );
};

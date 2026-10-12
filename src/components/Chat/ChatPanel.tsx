// src/components/Chat/ChatPanel.tsx
// Left sidebar: Chat messages, suggested prompts, voice recognition, and prompt input
import React, { useState, useRef, useEffect } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { SuggestedPrompts } from './SuggestedPrompts';
import { MessageItem } from './MessageItem';
import { startVoiceRecognition } from '../../services/audioService';
import { Send, Mic, MicOff, PlusCircle, MessageSquare } from 'lucide-react';

export const ChatPanel: React.FC = () => {
  const {
    messages,
    sendMessage,
    isGenerating,
    createNewSession,
    activeProvider
  } = useTutorStore();

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (isRecording) {
      stopVoiceRef.current?.();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const stop = startVoiceRecognition(
        (transcript) => {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        },
        () => setIsRecording(false)
      );
      stopVoiceRef.current = stop;
    }
  };

  return (
    <div className="chat-panel w-80 md:w-96 flex flex-col h-full bg-slate-900 border-r border-slate-800 z-10">
      {/* Chat Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Tutor Chat</h2>
            <div className="text-[10px] text-sky-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeProvider}</span>
            </div>
          </div>
        </div>

        <button
          onClick={createNewSession}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center gap-1 text-xs"
          title="Start fresh whiteboard session"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Suggested Prompts */}
      <SuggestedPrompts />

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {messages.map(msg => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        {isGenerating && (
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2.5 text-xs text-sky-400">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
            </div>
            <span>Tutor is writing & drawing on the board...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/95">
        <div className="relative rounded-xl bg-slate-800/80 border border-slate-700/80 focus-within:border-sky-500/60 focus-within:ring-1 focus-within:ring-sky-500/40 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or request a diagram (e.g. 'Prove Pythagoras')..."
            rows={2}
            className="w-full bg-transparent px-3 py-2.5 text-xs text-slate-100 placeholder-slate-400 resize-none outline-none"
          />

          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-slate-700/50">
            <div className="flex items-center gap-1.5">
              {/* Voice Input Button */}
              <button
                onClick={toggleVoice}
                className={`p-1.5 rounded-lg transition-all ${
                  isRecording
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'text-slate-400 hover:text-sky-300 hover:bg-slate-700/60'
                }`}
                title={isRecording ? 'Listening... click to stop' : 'Voice-to-board: Speak your question'}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              <span className="text-[10px] text-slate-400">Enter ↵ to draw</span>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-sky-500/20 transition-all"
              title="Send to Whiteboard Tutor"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

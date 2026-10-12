// src/components/Modals/SettingsModal.tsx
// Secrets management for API keys, multi-provider router, and handwriting fonts
import React, { useState } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { X, Key, Cpu, Type, Volume2, ShieldCheck, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useTutorStore();

  const [geminiKey, setGeminiKey] = useState(settings.keys.gemini || '');
  const [anthropicKey, setAnthropicKey] = useState(settings.keys.anthropic || '');
  const [groqKey, setGroqKey] = useState(settings.keys.groq || '');
  const [openRouterKey, setOpenRouterKey] = useState(settings.keys.openrouter || '');
  const [provider, setProvider] = useState(settings.provider);
  const [handFont, setHandFont] = useState(settings.handFont);
  const [enableTTS, setEnableTTS] = useState(settings.enableTTS);
  const [ttsRate, setTtsRate] = useState(settings.ttsRate);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings({
      provider,
      handFont,
      enableTTS,
      ttsRate,
      keys: {
        gemini: geminiKey.trim(),
        anthropic: anthropicKey.trim(),
        groq: groqKey.trim(),
        openrouter: openRouterKey.trim()
      }
    });
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl glass-panel shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Settings & Secrets</h3>
              <p className="text-[11px] text-slate-400">Manage LLM keys and whiteboard configuration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* Secrets Management Notice */}
          <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-sky-300 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Zero-Cost & Free-Tier Compatible</span>
              <span>
                All inference runs using free-tier keys or our built-in offline whiteboard simulation engine. Keys are securely routed through the server proxy.
              </span>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>Multi-Provider Router</span>
            </label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
            >
              <option value="auto">Auto Router (Gemini → Claude → Groq → OpenRouter on 429)</option>
              <option value="gemini">Google Gemini (Gemini 2.5 / 2.0 Flash)</option>
              <option value="anthropic">Anthropic Claude (Sonnet 4.5)</option>
              <option value="groq">Groq (Llama 3.3 70B, Qwen3)</option>
              <option value="openrouter">OpenRouter (Free Tier Models)</option>
            </select>
          </div>

          {/* API Keys */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Gemini API Key</span>
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy... (free in Google AI Studio)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-orange-400" />
                <span>Anthropic Claude API Key</span>
              </label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-... (console.anthropic.com)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Groq API Key</span>
              </label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_... (free tier 30 RPM)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-pink-400" />
                <span>OpenRouter API Key</span>
              </label>
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-... (free models :free)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Handwriting Font Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-emerald-400" />
              <span>Handwriting Font Style</span>
            </label>
            <select
              value={handFont}
              onChange={(e) => setHandFont(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-500 font-sans"
            >
              <option value="caveat">Caveat (Natural Cursive - Recommended)</option>
              <option value="kalam">Kalam (Artistic Brush Pen)</option>
              <option value="amiri">Amiri (Arabic & Calligraphy)</option>
              <option value="klee-one">Klee One (Japanese Script)</option>
            </select>
          </div>

          {/* Speech Synthesis Settings */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Enable Voice Narration (TTS)</span>
              </label>
              <input
                type="checkbox"
                checked={enableTTS}
                onChange={(e) => setEnableTTS(e.target.checked)}
                className="rounded text-sky-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Speech Speed</span>
                <span className="font-mono">{ttsRate.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={ttsRate}
                onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Preferences persist in IndexedDB</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg btn-gradient text-white font-semibold flex items-center gap-1.5"
            >
              {savedToast ? <Check className="w-4 h-4" /> : null}
              <span>{savedToast ? 'Saved!' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

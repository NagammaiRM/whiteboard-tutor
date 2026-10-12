// src/components/Modals/ExportModal.tsx
// Whiteboard and annotated PDF export modal (PNG, SVG, PDF, Session JSON)
import React, { useState } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { exportAnnotatedPDF } from '../../services/pdfService';
import { X, Download, FileCode, Image, FileText, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { commands, currentSessionId, messages, sources, notes, flashcards, settings } = useTutorStore();
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleExportSVG = () => {
    const svgEl = document.getElementById('whiteboard-svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whiteboard-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportPNG = () => {
    const svgEl = document.getElementById('whiteboard-svg') as SVGSVGElement | null;
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = settings.theme === 'chalkboard' ? '#13221c' : '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pngURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngURL;
        link.download = `whiteboard-${Date.now()}.png`;
        link.click();
      }
      URLObject.revokeObjectURL(blobURL);
      onClose();
    };
    image.src = blobURL;
  };

  const handleExportPDF = async () => {
    setDownloading(true);
    try {
      const pdfBytes = await exportAnnotatedPDF(null, commands);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `whiteboard-annotated-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setDownloading(false);
      onClose();
    }
  };

  const handleExportJSON = () => {
    const sessionData = {
      id: currentSessionId,
      exportedAt: new Date().toISOString(),
      messages,
      commands,
      sources,
      notes,
      flashcards,
      settings
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whiteboard-session-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Export Lesson</h3>
              <p className="text-[11px] text-slate-400">Save whiteboard drawing or annotated documents</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Options List */}
        <div className="p-5 space-y-2.5 text-xs">
          <button
            onClick={handleExportPNG}
            className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 flex items-center gap-3 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Export as High-Res PNG</h4>
              <p className="text-[11px] text-slate-400">2000×1400 crisp raster image of the whiteboard</p>
            </div>
          </button>

          <button
            onClick={handleExportSVG}
            className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 flex items-center gap-3 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Export as Scalable Vector (SVG)</h4>
              <p className="text-[11px] text-slate-400">Pure vector graphics with embedded fonts and paths</p>
            </div>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={downloading}
            className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 flex items-center gap-3 transition-all text-left disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">
                {downloading ? 'Generating PDF...' : 'Export Annotated PDF'}
              </h4>
              <p className="text-[11px] text-slate-400">Formatted document with vector highlights & margins</p>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 flex items-center gap-3 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Export Session Data (JSON)</h4>
              <p className="text-[11px] text-slate-400">Complete commands, transcript, notes, and cards</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// src/components/Sources/DocumentViewer.tsx
// PDF page viewer, document upload dropzone, sample documents, and annotation trigger
import React, { useRef } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { ingestPDFFile, ingestTextFile } from '../../services/pdfService';
import { Upload, FileText, ChevronLeft, ChevronRight, PenTool, BookOpen } from 'lucide-react';

export const DocumentViewer: React.FC = () => {
  const {
    sources,
    activeSourceId,
    activePageNumber,
    setActiveSource,
    setActivePage,
    addSource,
    setAnnotationMode,
    isAnnotationMode,
    loadSampleSource,
    toggleSourceSelection
  } = useTutorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSource = sources.find(s => s.id === activeSourceId) || sources[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let source;
      if (file.name.endsWith('.pdf')) {
        source = await ingestPDFFile(file);
      } else {
        source = await ingestTextFile(file);
      }
      await addSource(source);
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Failed to process file. Please ensure it is a valid PDF or text document.');
    }
  };

  const handleAnnotateThisPage = () => {
    if (activeSource) {
      setActiveSource(activeSource.id);
      setAnnotationMode(true);
    }
  };

  return (
    <div className="document-viewer flex-1 flex flex-col h-full overflow-hidden text-xs">
      {/* Upload & Sample Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-300">Grounding Documents</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-all flex items-center gap-1.5"
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Quick Sample Library */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] text-slate-400">Samples:</span>
          <button
            onClick={() => loadSampleSource('pythagoras')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap"
          >
            Pythagoras PDF
          </button>
          <button
            onClick={() => loadSampleSource('kant')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap"
          >
            Kant MD
          </button>
          <button
            onClick={() => loadSampleSource('ai')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap"
          >
            Neural Nets TXT
          </button>
        </div>
      </div>

      {/* Document Selector Chips */}
      {sources.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950 flex items-center gap-2 overflow-x-auto">
          {sources.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSource(s.id)}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all text-[11px] truncate max-w-[150px] ${
                activeSource?.id === s.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Document Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {activeSource ? (
          <div>
            {/* Document Header & Annotation Action */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activeSource.selected}
                  onChange={() => toggleSourceSelection(activeSource.id)}
                  className="rounded text-sky-500 focus:ring-0"
                  title="Include in RAG grounding search"
                />
                <span className="font-medium text-slate-200 truncate max-w-[140px]">{activeSource.name}</span>
              </div>

              <button
                onClick={handleAnnotateThisPage}
                className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 text-[11px]"
              >
                <PenTool className="w-3 h-3" />
                <span>Annotate on Board</span>
              </button>
            </div>

            {/* Rendered PDF Page View */}
            {activeSource.pages && activeSource.pages.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400 px-1 text-[11px]">
                  <span>Page {activePageNumber} of {activeSource.pages.length}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActivePage(Math.max(1, activePageNumber - 1))}
                      disabled={activePageNumber <= 1}
                      className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActivePage(Math.min(activeSource.pages!.length, activePageNumber + 1))}
                      disabled={activePageNumber >= activeSource.pages.length}
                      className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="rounded-lg overflow-hidden border border-slate-700/70 shadow-md bg-white">
                  {activeSource.pages[activePageNumber - 1]?.dataUrl ? (
                    <img
                      src={activeSource.pages[activePageNumber - 1].dataUrl}
                      alt={`Page ${activePageNumber}`}
                      className="w-full object-contain"
                    />
                  ) : (
                    <div className="p-4 text-slate-800 bg-white font-serif text-xs leading-relaxed max-h-64 overflow-y-auto">
                      {activeSource.pages[activePageNumber - 1]?.text || activeSource.text}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 leading-relaxed font-mono text-[11px] max-h-80 overflow-y-auto">
                {activeSource.text}
              </div>
            )}

            {/* Extracted Chunks Preview */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Semantic Chunks ({activeSource.chunks?.length || 0})
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {activeSource.chunks?.slice(0, 4).map((c, i) => (
                  <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-normal">
                    "{c.text.slice(0, 110)}..."
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4">
            <BookOpen className="w-8 h-8 text-slate-400 mb-2" />
            <p className="font-medium text-slate-300 mb-1">No documents ingested</p>
            <p className="text-[11px] text-slate-400 max-w-[200px]">
              Upload a PDF/notes or click a sample button above to enable grounded RAG and visual document annotation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

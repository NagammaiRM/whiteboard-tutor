// src/components/Sources/NotesManager.tsx
// Pinned lesson notes, student scratchpad, and note-to-source grounding
import React, { useState } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { Bookmark, Plus, FileText, Trash2 } from 'lucide-react';
import { deleteNote } from '../../services/db';

export const NotesManager: React.FC = () => {
  const { notes, addNote, addSource } = useTutorStore();
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await addNote(newTitle.trim(), newContent.trim());
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleConvertToSource = async (title: string, content: string) => {
    await addSource({
      id: `src_note_${Date.now()}`,
      name: `Note: ${title}`,
      kind: 'note',
      pageCount: 1,
      text: `${title}\n\n${content}`,
      chunks: [{ id: `chunk_note_${Date.now()}`, sourceId: `note_${Date.now()}`, text: content }],
      selected: true,
      summary: content.slice(0, 100) + '...'
    });
    alert(`Converted "${title}" into a grounded knowledge source!`);
  };

  return (
    <div className="notes-manager flex-1 flex flex-col h-full overflow-hidden text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <span className="font-semibold text-slate-300">Study Notes & Pinned Lessons</span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>New Note</span>
        </button>
      </div>

      {/* New Note Form */}
      {isAdding && (
        <div className="p-3 border-b border-slate-800 bg-slate-800/40 space-y-2 animate-fadeIn">
          <input
            type="text"
            placeholder="Note title (e.g. Hypotenuse derivation)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700 text-slate-100 outline-none text-xs"
          />
          <textarea
            placeholder="Write key equations or takeaways..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            className="w-full bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700 text-slate-100 outline-none text-xs resize-none"
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setIsAdding(false)}
              className="px-2 py-1 rounded text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-semibold"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center">
            <Bookmark className="w-7 h-7 text-slate-400 mb-1.5" />
            <p>No study notes yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click the bookmark icon on any tutor lesson to pin it here.
            </p>
          </div>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{note.title}</span>
                <button
                  onClick={() => handleConvertToSource(note.title, note.content)}
                  className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 hover:bg-sky-900 text-[10px] flex items-center gap-1"
                  title="Make this note searchable by the tutor"
                >
                  <FileText className="w-2.5 h-2.5" />
                  <span>Ground Tutor</span>
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                {note.content}
              </p>
              <div className="text-[10px] text-slate-400 pt-1">
                {new Date(note.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

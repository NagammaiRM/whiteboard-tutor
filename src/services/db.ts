// src/services/db.ts
// IndexedDB persistence service for Whiteboard Tutor sessions, sources, and notes
import { openDB, IDBPDatabase } from 'idb';
import type { SessionState, SourceMeta, Note, Flashcard } from '../types/tutor';

const DB_NAME = 'whiteboard-tutor-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sources')) {
          db.createObjectStore('sources', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('flashcards')) {
          db.createObjectStore('flashcards', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: SessionState): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getSession(id: string): Promise<SessionState | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function getAllSessions(): Promise<SessionState[]> {
  const db = await getDB();
  return db.getAll('sessions');
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function saveSource(source: SourceMeta): Promise<void> {
  const db = await getDB();
  await db.put('sources', source);
}

export async function getAllSources(): Promise<SourceMeta[]> {
  const db = await getDB();
  return db.getAll('sources');
}

export async function deleteSource(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sources', id);
}

export async function saveNote(note: Note): Promise<void> {
  const db = await getDB();
  await db.put('notes', note);
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDB();
  return db.getAll('notes');
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notes', id);
}

export async function saveFlashcards(cards: Flashcard[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('flashcards', 'readwrite');
  for (const card of cards) {
    await tx.store.put(card);
  }
  await tx.done;
}

export async function getAllFlashcards(): Promise<Flashcard[]> {
  const db = await getDB();
  return db.getAll('flashcards');
}

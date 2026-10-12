// src/types/tutor.ts
// Core data models for Whiteboard Tutor

export type DrawCommand =
  | { type: 'clear' }
  | { type: 'say'; text: string }
  | { type: 'write'; text: string; x: number; y: number; size: number; font?: string; color?: string; maxWidth?: number; id?: string }
  | { type: 'math'; tex: string; x: number; y: number; size: number; color?: string; id?: string }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; id?: string }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; id?: string }
  | { type: 'rect'; x: number; y: number; w: number; h: number; color?: string; fill?: string; width?: number; id?: string }
  | { type: 'circle'; cx: number; cy: number; r: number; color?: string; fill?: string; width?: number; id?: string }
  | { type: 'dot'; cx: number; cy: number; r: number; color?: string; id?: string }
  | { type: 'highlight'; x: number; y: number; w: number; h: number; color?: string; id?: string }
  | { type: 'underline'; x1: number; y1: number; x2: number; y2: number; color?: string; id?: string }
  | { type: 'note'; text: string; x: number; y: number; size?: number; color?: string; id?: string }
  | { type: 'polygon'; points: [number, number][]; color?: string; fill?: string; width?: number; id?: string }
  | { type: 'path'; d: string; color?: string; width?: number; fill?: string; id?: string }
  | { type: 'cite'; i: number; sourceId: string; page?: number; quote: string; rect?: [number, number, number, number] }
  | { type: 'goto'; page: number }
  | { type: 'done' };

export type Citation = {
  i: number;
  sourceId: string;
  sourceName?: string;
  page?: number;
  quote: string;
  rect?: [number, number, number, number];
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  commands?: DrawCommand[];
  citations?: Citation[];
  spokenText?: string;
  turnIndex: number;
  isPinned?: boolean;
};

export type Chunk = {
  id: string;
  sourceId: string;
  sourceName?: string;
  text: string;
  page?: number;
  score?: number;
};

export type SourcePage = {
  pageNumber: number;
  text: string;
  dataUrl?: string;
  width?: number;
  height?: number;
};

export type SourceMeta = {
  id: string;
  name: string;
  kind: 'pdf' | 'docx' | 'txt' | 'md' | 'image' | 'note';
  pageCount: number;
  text: string;
  pages?: SourcePage[];
  chunks: Chunk[];
  summary?: string;
  selected: boolean;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  color?: string;
  isGroundedSource?: boolean;
};

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  interval?: number;
  repetitionCount?: number;
  nextReview?: number;
};

export type TutorSettings = {
  provider: 'auto' | 'gemini' | 'anthropic' | 'groq' | 'openrouter';
  model: string;
  handFont: string;
  speed: number; // 0.5, 1, 2, 999
  theme: 'whiteboard' | 'chalkboard' | 'midnight';
  gridType: 'none' | 'dots' | 'ruled' | 'grid';
  enableWobble: boolean;
  enableTTS: boolean;
  ttsVoiceName?: string;
  ttsRate: number;
  ttsPitch: number;
  explanationLevel: 'beginner' | 'intermediate' | 'advanced';
  teachingMode: 'direct' | 'socratic';
  keys: {
    gemini?: string;
    anthropic?: string;
    groq?: string;
    openrouter?: string;
  };
};

export type SessionState = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  board: {
    commands: DrawCommand[];
    background?: {
      sourceId: string;
      pageIndex: number;
      dataUrl?: string;
      width: number;
      height: number;
    };
  };
  sources: SourceMeta[];
  notes: Note[];
  flashcards: Flashcard[];
  settings: TutorSettings;
};

export type MindMapNode = {
  id: string;
  topic: string;
  children?: MindMapNode[];
  color?: string;
};

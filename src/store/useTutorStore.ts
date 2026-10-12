// src/store/useTutorStore.ts
// Zustand store for Whiteboard Tutor state management
import { create } from 'zustand';
import type { DrawCommand, Message, SourceMeta, Note, Flashcard, TutorSettings, Citation, SessionState } from '../types/tutor';
import { streamTutorCommands } from '../services/apiClient';
import { searchChunks, buildGroundingContext, chunkDocument } from '../services/rag';
import { audioService } from '../services/audioService';
import { saveSession, getAllSessions, getAllSources, getAllNotes, getAllFlashcards, saveSource, saveNote, saveFlashcards } from '../services/db';

const DEFAULT_SETTINGS: TutorSettings = {
  provider: 'auto',
  model: 'gemini-2.5-flash',
  handFont: 'caveat',
  speed: 1,
  theme: 'whiteboard',
  gridType: 'dots',
  enableWobble: true,
  enableTTS: true,
  ttsRate: 1.05,
  ttsPitch: 1.0,
  explanationLevel: 'intermediate',
  keys: {
    gemini: '',
    groq: '',
    openrouter: ''
  }
};

interface TutorState {
  // Session & Chat
  sessions: SessionState[];
  currentSessionId: string;
  messages: Message[];
  isGenerating: boolean;
  activeProvider: string;
  statusMessage: string;

  // Board
  commands: DrawCommand[];
  renderedCommands: DrawCommand[];
  turnHistory: DrawCommand[][];
  boardBackground: {
    sourceId: string;
    pageIndex: number;
    dataUrl?: string;
    width: number;
    height: number;
  } | null;
  laserPosition: { x: number; y: number } | null;
  isReplaying: boolean;

  // Sources & Grounding
  sources: SourceMeta[];
  activeSourceId: string | null;
  activePageNumber: number;
  isAnnotationMode: boolean;
  activeCitation: Citation | null;

  // Study Tools
  notes: Note[];
  flashcards: Flashcard[];
  settings: TutorSettings;

  // Actions
  init: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addCommand: (cmd: DrawCommand) => void;
  undoTurn: () => void;
  clearBoard: () => void;
  replayTurn: () => void;
  skipAnimation: () => void;
  setSpeed: (speed: number) => void;
  setExplanationLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  setTheme: (theme: 'whiteboard' | 'chalkboard' | 'midnight') => void;
  setGridType: (grid: 'none' | 'dots' | 'ruled' | 'grid') => void;
  toggleWobble: () => void;
  setAnnotationMode: (enabled: boolean) => void;
  setActiveSource: (id: string | null) => void;
  setActivePage: (page: number) => void;
  addSource: (source: SourceMeta) => Promise<void>;
  toggleSourceSelection: (id: string) => void;
  addNote: (title: string, content: string) => Promise<void>;
  pinMessageToNote: (msgId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<TutorSettings>) => void;
  setLaserPosition: (pos: { x: number; y: number } | null) => void;
  loadSampleSource: (type: 'pythagoras' | 'kant' | 'ai') => Promise<void>;
  createNewSession: () => void;
}

export const useTutorStore = create<TutorState>((set, get) => ({
  sessions: [],
  currentSessionId: 'default_session',
  messages: [
    {
      id: 'welcome_msg',
      role: 'assistant',
      content: "Hello! I'm your AI Whiteboard Tutor. Ask me any question in math, science, or philosophy, or upload your documents to annotate and study with grounded Q&A.",
      timestamp: Date.now(),
      turnIndex: 0
    }
  ],
  isGenerating: false,
  activeProvider: 'Auto-Routing Engine',
  statusMessage: 'Ready',

  commands: [],
  renderedCommands: [],
  turnHistory: [],
  boardBackground: null,
  laserPosition: null,
  isReplaying: false,

  sources: [],
  activeSourceId: null,
  activePageNumber: 1,
  isAnnotationMode: false,
  activeCitation: null,

  notes: [],
  flashcards: [
    {
      id: 'fc_1',
      question: 'What is the Pythagorean Theorem equation?',
      answer: 'a² + b² = c², where c is the hypotenuse of a right triangle.',
      difficulty: 'easy'
    },
    {
      id: 'fc_2',
      question: 'What is the geometric definition of a derivative in calculus?',
      answer: 'The slope of the tangent line to the function at a specific point, defined as lim(h→0) [f(x+h) - f(x)] / h.',
      difficulty: 'medium'
    }
  ],
  settings: DEFAULT_SETTINGS,

  init: async () => {
    try {
      const savedSources = await getAllSources();
      const savedNotes = await getAllNotes();
      const savedCards = await getAllFlashcards();
      const savedSessions = await getAllSessions();

      set({
        sources: savedSources.length > 0 ? savedSources : get().sources,
        notes: savedNotes.length > 0 ? savedNotes : get().notes,
        flashcards: savedCards.length > 0 ? savedCards : get().flashcards,
        sessions: savedSessions.length > 0 ? savedSessions : []
      });
    } catch (e) {
      console.warn('Storage init notice:', e);
    }
  },

  sendMessage: async (content: string) => {
    if (!content.trim() || get().isGenerating) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      turnIndex: get().messages.length
    };

    set({
      messages: [...get().messages, userMsg],
      isGenerating: true,
      statusMessage: 'Formulating visual lesson...'
    });

    // Check Grounding Sources
    const activeSources = get().sources.filter(s => s.selected);
    const matchedChunks = searchChunks(content, activeSources, 4);
    const sourceContext = matchedChunks.length > 0 ? buildGroundingContext(matchedChunks) : null;

    const currentTurnCommands: DrawCommand[] = [];
    const currentCitations: Citation[] = [];
    let spokenNarration = '';

    const assistantMsgId = `asst_${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      turnIndex: get().messages.length + 1,
      commands: []
    };

    set({ messages: [...get().messages, userMsg, initialAssistantMsg] });

    await streamTutorCommands(
      [
        ...get().messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content }
      ],
      get().settings,
      sourceContext,
      get().isAnnotationMode,
      get().activePageNumber,
      {
        onStatus: (status) => {
          set({ activeProvider: status.provider, statusMessage: status.message });
        },
        onCommand: (cmd) => {
          currentTurnCommands.push(cmd);

          if (cmd.type === 'say') {
            spokenNarration += (spokenNarration ? ' ' : '') + cmd.text;
            if (get().settings.enableTTS) {
              audioService.speak(cmd.text, {
                rate: get().settings.ttsRate,
                pitch: get().settings.ttsPitch
              });
            }
          }

          if (cmd.type === 'cite') {
            currentCitations.push({
              i: cmd.i,
              sourceId: cmd.sourceId,
              page: cmd.page,
              quote: cmd.quote,
              rect: cmd.rect
            });
          }

          // Update board in real time
          if (cmd.type === 'clear') {
            set({ commands: [], renderedCommands: [] });
          } else if (cmd.type !== 'say' && cmd.type !== 'cite' && cmd.type !== 'done') {
            set(state => ({
              commands: [...state.commands, cmd],
              renderedCommands: [...state.renderedCommands, cmd]
            }));

            // Update laser pointer position
            if ('x' in cmd && 'y' in cmd) {
              set({ laserPosition: { x: cmd.x as number, y: cmd.y as number } });
            } else if ('cx' in cmd && 'cy' in cmd) {
              set({ laserPosition: { x: cmd.cx as number, y: cmd.cy as number } });
            } else if ('x1' in cmd && 'y1' in cmd) {
              set({ laserPosition: { x: cmd.x1 as number, y: cmd.y1 as number } });
            }
          }

          // Update assistant message with commands
          set(state => ({
            messages: state.messages.map(m => {
              if (m.id === assistantMsgId) {
                return {
                  ...m,
                  commands: [...currentTurnCommands],
                  citations: [...currentCitations],
                  spokenText: spokenNarration,
                  content: spokenNarration || 'Lesson rendered on whiteboard.'
                };
              }
              return m;
            })
          }));
        },
        onDone: () => {
          set(state => ({
            isGenerating: false,
            statusMessage: 'Lesson complete',
            laserPosition: null,
            turnHistory: [...state.turnHistory, currentTurnCommands]
          }));

          // Auto-save session
          const sessionSnapshot: SessionState = {
            id: get().currentSessionId,
            title: content.slice(0, 30),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: get().messages,
            board: {
              commands: get().commands,
              background: get().boardBackground || undefined
            },
            sources: get().sources,
            notes: get().notes,
            flashcards: get().flashcards,
            settings: get().settings
          };
          saveSession(sessionSnapshot);
        },
        onError: () => {
          set({
            isGenerating: false,
            statusMessage: 'Notice: operating in responsive mode',
            laserPosition: null
          });
        }
      }
    );
  },

  addCommand: (cmd: DrawCommand) => {
    if (cmd.type === 'clear') {
      set({ commands: [], renderedCommands: [] });
    } else {
      set(state => ({
        commands: [...state.commands, cmd],
        renderedCommands: [...state.renderedCommands, cmd]
      }));
    }
  },

  undoTurn: () => {
    const history = [...get().turnHistory];
    if (history.length === 0) return;
    history.pop();

    // Reconstruct board from remaining turn history
    const allRemaining = history.flat().filter(c => c.type !== 'clear' && c.type !== 'say' && c.type !== 'cite' && c.type !== 'done');
    set({
      turnHistory: history,
      commands: allRemaining,
      renderedCommands: allRemaining
    });
  },

  clearBoard: () => {
    set({
      commands: [],
      renderedCommands: [],
      turnHistory: [],
      laserPosition: null
    });
  },

  replayTurn: () => {
    const cmds = [...get().commands];
    set({ renderedCommands: [], isReplaying: true });

    let i = 0;
    const intervalTime = Math.max(40, 200 / get().settings.speed);
    const interval = setInterval(() => {
      if (i >= cmds.length) {
        clearInterval(interval);
        set({ isReplaying: false, laserPosition: null });
        return;
      }
      const cmd = cmds[i];
      set(state => ({
        renderedCommands: [...state.renderedCommands, cmd]
      }));

      if ('x' in cmd && 'y' in cmd) {
        set({ laserPosition: { x: cmd.x as number, y: cmd.y as number } });
      } else if ('cx' in cmd && 'cy' in cmd) {
        set({ laserPosition: { x: cmd.cx as number, y: cmd.cy as number } });
      }

      i++;
    }, intervalTime);
  },

  skipAnimation: () => {
    set(state => ({
      renderedCommands: [...state.commands],
      isReplaying: false,
      laserPosition: null
    }));
  },

  setSpeed: (speed: number) => {
    set(state => ({ settings: { ...state.settings, speed } }));
  },

  setExplanationLevel: (explanationLevel: 'beginner' | 'intermediate' | 'advanced') => {
    set(state => ({ settings: { ...state.settings, explanationLevel } }));
  },

  setTheme: (theme: 'whiteboard' | 'chalkboard' | 'midnight') => {
    set(state => ({ settings: { ...state.settings, theme } }));
  },

  setGridType: (gridType: 'none' | 'dots' | 'ruled' | 'grid') => {
    set(state => ({ settings: { ...state.settings, gridType } }));
  },

  toggleWobble: () => {
    set(state => ({
      settings: { ...state.settings, enableWobble: !state.settings.enableWobble }
    }));
  },

  setAnnotationMode: (enabled: boolean) => {
    const activeSrc = get().sources.find(s => s.id === get().activeSourceId);
    let bg = null;
    if (enabled && activeSrc?.pages && activeSrc.pages.length > 0) {
      const page = activeSrc.pages[get().activePageNumber - 1] || activeSrc.pages[0];
      bg = {
        sourceId: activeSrc.id,
        pageIndex: page.pageNumber,
        dataUrl: page.dataUrl,
        width: page.width || 1000,
        height: page.height || 700
      };
    }
    set({
      isAnnotationMode: enabled,
      boardBackground: bg
    });
  },

  setActiveSource: (id: string | null) => {
    set({ activeSourceId: id });
    if (get().isAnnotationMode) {
      get().setAnnotationMode(true);
    }
  },

  setActivePage: (page: number) => {
    set({ activePageNumber: page });
    if (get().isAnnotationMode) {
      get().setAnnotationMode(true);
    }
  },

  addSource: async (source: SourceMeta) => {
    set(state => ({
      sources: [...state.sources, source],
      activeSourceId: source.id,
      activePageNumber: 1
    }));
    await saveSource(source);
  },

  toggleSourceSelection: (id: string) => {
    set(state => ({
      sources: state.sources.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
    }));
  },

  addNote: async (title: string, content: string) => {
    const note: Note = {
      id: `note_${Date.now()}`,
      title,
      content,
      createdAt: Date.now(),
      color: '#fbbf24'
    };
    set(state => ({ notes: [note, ...state.notes] }));
    await saveNote(note);
  },

  pinMessageToNote: async (msgId: string) => {
    const msg = get().messages.find(m => m.id === msgId);
    if (!msg) return;

    const noteTitle = msg.role === 'assistant' ? 'Whiteboard Tutor Lesson' : 'Student Question';
    await get().addNote(noteTitle, msg.content || msg.spokenText || 'Board commands recorded');
    set(state => ({
      messages: state.messages.map(m => m.id === msgId ? { ...m, isPinned: true } : m)
    }));
  },

  updateSettings: (newSettings: Partial<TutorSettings>) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },

  setLaserPosition: (pos: { x: number; y: number } | null) => {
    set({ laserPosition: pos });
  },

  loadSampleSource: async (type: 'pythagoras' | 'kant' | 'ai') => {
    let source: SourceMeta;
    if (type === 'pythagoras') {
      const text = `The Pythagorean theorem states that in any right triangle with perpendicular sides a and b and hypotenuse c: a^2 + b^2 = c^2. Discovered by Pythagoras of Samos circa 500 BCE. Essential in Euclidean geometry, trigonometry, and calculating Euclidean distance in multi-dimensional space. Verified citation [1]: "The area of the square whose side is the hypotenuse is equal to the sum of the areas of the squares on the other two sides."`;
      source = {
        id: 'sample_pythagoras',
        name: 'Pythagorean Theorem & Right Triangles.pdf',
        kind: 'pdf',
        pageCount: 3,
        text,
        chunks: chunkDocument('sample_pythagoras', 'Pythagorean Theorem & Right Triangles.pdf', text),
        selected: true,
        summary: 'Classical proof and geometrical foundations of right triangles.'
      };
    } else if (type === 'kant') {
      const text = `Immanuel Kant's transcendental idealism argues that human experience of things is similar to the way they appear to us—synthetic a priori judgments are possible. In the Groundwork of the Metaphysics of Morals, Kant formulates the Categorical Imperative: "Act only according to that maxim whereby you can at the same time will that it should become a universal law." Verified citation [2]: "Duty is the necessity of an action from respect for law."`;
      source = {
        id: 'sample_kant',
        name: 'Kant - Critique of Pure Reason.md',
        kind: 'md',
        pageCount: 2,
        text,
        chunks: chunkDocument('sample_kant', 'Kant - Critique of Pure Reason.md', text),
        selected: true,
        summary: 'Categorical imperative, synthetic a priori, and transcendental idealism.'
      };
    } else {
      const text = `Artificial Neural Networks are computational systems inspired by biological neural networks. Each neuron computes an affine transformation z = Wx + b followed by a non-linear activation function sigma(z). Backpropagation computes the analytical gradient of the loss function with respect to all weights using the multivariable calculus chain rule. Verified citation [3]: "Gradient descent optimizes the parameter space towards a minimal empirical risk."`;
      source = {
        id: 'sample_ai',
        name: 'Neural Networks & Deep Learning.txt',
        kind: 'txt',
        pageCount: 4,
        text,
        chunks: chunkDocument('sample_ai', 'Neural Networks & Deep Learning.txt', text),
        selected: true,
        summary: 'Feedforward architecture, matrix weights, activation functions, and backpropagation.'
      };
    }

    await get().addSource(source);
  },

  createNewSession: () => {
    set({
      currentSessionId: `session_${Date.now()}`,
      messages: [
        {
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content: 'New whiteboard session ready. Ask anything or pick a study topic below!',
          timestamp: Date.now(),
          turnIndex: 0
        }
      ],
      commands: [],
      renderedCommands: [],
      turnHistory: [],
      laserPosition: null,
      isAnnotationMode: false,
      boardBackground: null
    });
  }
}));

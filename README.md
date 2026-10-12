# Whiteboard Tutor on Google AI Studio — Build v2.0

A zero-cost, handwriting AI whiteboard tutor with document annotation and NotebookLM-style grounded Q&A. Built with React 19, TypeScript, Vite, SVG stroke animations, KaTeX LaTeX math, and Node.js proxy server.

---

## 🚀 Live Local URL
The dev server is actively running at:
**[http://localhost:5173/](http://localhost:5173/)**

---

## 🎨 Core Features Implemented

### 1. Three-Panel Architecture
- **Chat & Voice (Left Panel)**:
  - Interactive tutor thread with real-time JSONL streaming output.
  - Voice-to-board button using the Web Speech API speech recognition.
  - Suggested quick-start lesson chips (Pythagorean Theorem, Neural Networks, Calculus Derivatives, Photosynthesis, Kant's Categorical Imperative).
  - Smart citation badges `[1]`, `[2]` linking directly to matching source passages.
  - One-click text-to-speech narration and pin-to-notes bookmarks.
- **SVG Whiteboard (Center Panel)**:
  - 1000 × 700 coordinate system with 40-unit safe margins.
  - **Handwriting Engine**: Animated stroke-by-stroke handwriting with bundled cursive fonts (`Caveat`, `Kalam`, `Amiri`, `Klee One`).
  - **KaTeX LaTeX Math**: Crisp mathematical equations ($a^2 + b^2 = c^2$, $\lim_{h\to 0}\frac{f(x+h)-f(x)}{h}$, $\sigma(z)$) embedded inside SVG.
  - **Geometric Shapes**: Lines, arrows, rectangles, circles, dots, polygons, underlines, and custom paths with SVG stroke animations.
  - **Hand-drawn Wobble Filter**: Real SVG `feTurbulence` + `feDisplacementMap` filter for natural hand-drawn tremors.
  - **Chalkboard Mode**: One-click toggle between classic porcelain dry-erase whiteboard and textured dark green slate chalkboard.
  - **Live Pen Nib / Laser Pointer**: Pulsing laser cursor following the AI tutor's exact drawing coordinates in real time.
  - **Playback Controls**: Speed slider ($0.5\times$, $1\times$, $2\times$, Instant), Replay (`↺`), Undo Turn (`Cmd+Z`), and Clear canvas.
- **Sources & Study Hub (Right Panel - 5 Integrated Tools)**:
  1. **Document Viewer & Annotation**: Ingest PDFs (`pdfjs-dist`), Markdown, and text files. Includes page preview, text extraction with bounding boxes, and an **Annotate on Board** mode that renders the document page directly as the whiteboard background layer.
  2. **Study Notes**: Pin tutor lessons, write personal notes, and convert any note into a grounded knowledge source for the AI tutor.
  3. **Mind Map Generator**: Concept map generation with interactive tree visualization and a **"Draw on Whiteboard"** button that automatically translates the tree into SVG drawing commands on the board.
  4. **Audio Overview Podcast (NotebookLM Style)**: 2-host conversational deep dive ("Alex" & "Morgan") with dual-voice Web Speech API TTS, animated talking avatars, and synchronized transcript highlighting.
  5. **Spaced Repetition Flashcards**: Interactive 3D flip cards with self-assessment buttons (*Hard*, *Good*, *Easy*).

---

## ⚙️ Server-Side Multi-Provider Proxy (`/api/tutor`)
- Located in `server/router.mjs` and integrated with Vite dev server and standalone Express (`server/index.mjs`).
- Hides API secrets on the server side:
  - **Google Gemini**: Gemini 2.5 Flash / Gemini 2.0 Flash
  - **Groq**: Llama 3.3 70B, Qwen3
  - **OpenRouter**: Free tier models (`:free`)
- **Automatic 429 Failover**: Seamlessly shifts to the next available provider on rate limits.
- **Built-in Smart Tutor Simulator**: Works completely out-of-the-box with zero API keys required, producing full pedagogical drawing scripts for math, science, and custom student queries!

---

## ⌨️ Keyboard Shortcuts
- **`Cmd + K` / `Ctrl + K`**: Open Spotlight Command Palette
- **`Cmd + Z` / `Ctrl + Z`**: Undo last turn's drawing operations
- **`Escape`**: Skip drawing animations immediately to final state
- **`Enter`**: Submit prompt to whiteboard tutor

---

## 💾 Export Capabilities
- **High-Res PNG**: 2000 × 1400 raster image export
- **Scalable Vector Graphics (SVG)**: Vector paths and embedded styles
- **Annotated PDF**: Uses `pdf-lib` to overlay vector annotations and highlights onto PDF pages
- **Session Data (JSON)**: Full command history, transcripts, notes, and flashcards

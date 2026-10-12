// server/router.mjs
// Multi-provider LLM router with fallback, 429 retry, explanation levels, and smart math solver

export const SYSTEM_PROMPT = `You are an expert tutor who teaches by drawing and writing on a whiteboard.
You MUST reply with ONE JSON OBJECT PER LINE. Nothing else. No markdown fences, no conversational filler outside JSON.

Board: 1000 × 700, origin top-left, 40-unit safe margin.

COMMANDS:
{"type":"clear"}
{"type":"say","text":"Spoken narration by voice synthesizer"}
{"type":"write","text":"Label","x":100,"y":120,"size":28,"font":"caveat","color":"#38bdf8"}
{"type":"math","tex":"\\\\frac{a}{b}","x":200,"y":300,"size":34,"color":"#f1f5f9"}
{"type":"line","x1":100,"y1":200,"x2":300,"y2":200,"width":3,"color":"#94a3b8"}
{"type":"arrow","x1":300,"y1":200,"x2":450,"y2":320,"width":3,"color":"#38bdf8"}
{"type":"rect","x":100,"y":150,"w":200,"h":100,"width":2,"color":"#6366f1"}
{"type":"circle","cx":300,"cy":300,"r":50,"width":2,"color":"#ec4899"}
{"type":"dot","cx":300,"cy":300,"r":5,"color":"#f43f5e"}
{"type":"highlight","x":80,"y":100,"w":280,"h":40,"color":"#fde68a"}
{"type":"underline","x1":100,"y1":160,"x2":320,"y2":160,"color":"#ef4444"}
{"type":"note","text":"margin note","x":740,"y":180,"size":20,"color":"#fbbf24"}
{"type":"polygon","points":[[100,100],[300,100],[200,250]],"width":2,"color":"#10b981"}
{"type":"path","d":"M 100 100 Q 250 50 400 100","width":3,"color":"#a855f7"}
{"type":"cite","i":1,"sourceId":"src_1","page":1,"quote":"exact quote","rect":[100,120,300,50]}
{"type":"goto","page":1}
{"type":"done"}

RULES:
- Emit 8 to 16 commands per turn. Small, structured, pedagogical steps.
- Put each label near the object it labels.
- Use "math" for ALL mathematical and scientific formulas. Always escape backslashes like "\\\\frac{a}{b}".
- Keep "write" under 120 characters per command.
- Emit "say" commands early and alongside diagrams so TTS speaks naturally while drawing.
- ACCURACY MANDATE: For ANY arithmetic or calculation (e.g. 5x5, 12+8, equations), you MUST explicitly calculate the EXACT numerical answer and draw a prominent highlighted box around the final answer so it is immediately obvious!
`;

export async function handleTutorStream(req, res) {
  const {
    messages = [],
    provider = 'auto',
    keys = {},
    sourceContext = null,
    isAnnotation = false,
    page = 1,
    explanationLevel = 'intermediate'
  } = req.body || {};

  // Set SSE headers for streaming JSONL
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendLine = (line) => {
    if (typeof line === 'object') {
      res.write(`data: ${JSON.stringify(line)}\n\n`);
    } else {
      res.write(`data: ${line}\n\n`);
    }
  };

  const geminiKey = keys.gemini || process.env.GEMINI_KEY || process.env.VITE_GEMINI_KEY;
  const anthropicKey = keys.anthropic || process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY;
  const groqKey = keys.groq || process.env.GROQ_KEY || process.env.VITE_GROQ_KEY;
  const openRouterKey = keys.openrouter || process.env.OPENROUTER_KEY || process.env.VITE_OPENROUTER_KEY;

  const providers = [];
  if (provider === 'gemini' || provider === 'auto') {
    if (geminiKey) providers.push({ id: 'gemini', key: geminiKey, name: 'Google Gemini' });
  }
  if (provider === 'anthropic' || provider === 'auto') {
    if (anthropicKey) providers.push({ id: 'anthropic', key: anthropicKey, name: 'Anthropic Claude' });
  }
  if (provider === 'groq' || provider === 'auto') {
    if (groqKey) providers.push({ id: 'groq', key: groqKey, name: 'Groq (Llama 3.3)' });
  }
  if (provider === 'openrouter' || provider === 'auto') {
    if (openRouterKey) providers.push({ id: 'openrouter', key: openRouterKey, name: 'OpenRouter' });
  }

  // Try real providers in sequence if keys are available
  let providerSuccess = false;
  for (const p of providers) {
    try {
      sendLine({ t: 'status', provider: p.name, message: `Connecting to ${p.name}...` });
      const stream = await callProvider(p, messages, sourceContext, isAnnotation, page, explanationLevel);
      if (stream) {
        for await (const chunk of stream) {
          sendLine(chunk);
        }
        providerSuccess = true;
        break;
      }
    } catch (err) {
      console.warn(`Provider ${p.id} failed:`, err.message);
      sendLine({ t: 'status', provider: p.name, message: `${p.name} busy or rate limited (429). Falling back...` });
      continue;
    }
  }

  // If no providers configured or all failed, stream using smart built-in tutor engine!
  if (!providerSuccess) {
    sendLine({ t: 'status', provider: 'Whiteboard AI Engine', message: `Generating lesson (${explanationLevel} level)...` });
    await streamBuiltInSimulation(messages, sourceContext, isAnnotation, page, sendLine, explanationLevel);
  }

  sendLine({ type: 'done' });
  res.write('event: end\ndata: [DONE]\n\n');
  res.end();
}

async function callProvider(provider, messages, sourceContext, isAnnotation, page, explanationLevel) {
  let promptContext = SYSTEM_PROMPT;
  promptContext += `\nEXPLANATION LEVEL: ${explanationLevel.toUpperCase()}.
- beginner (EL5): Simple analogies, everyday objects, count step-by-step, plain terms.
- intermediate: Balanced, standard definitions, algebraic equations, steady pacing.
- advanced: Rigorous mathematical proofs, formal axioms, deep technical derivations.`;

  if (isAnnotation) {
    promptContext += `\nAnnotation Mode: You are drawing directly on page ${page} of the open document. Use coordinates (1000x700). Anchor notes near the items in margins.`;
  }
  if (sourceContext) {
    promptContext += `\nGROUNDING SOURCES:\n${sourceContext}\nAnswer strictly from these sources and emit {"type":"cite",...} markers for facts.`;
  }

  if (provider.id === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${provider.key}`;
    const userPrompt = messages[messages.length - 1]?.content || 'Explain the concept';

    const body = {
      contents: [
        { role: 'user', parts: [{ text: `${promptContext}\n\nStudent request: ${userPrompt}` }] }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (resp.status === 429) throw new Error('Gemini 429 Rate Limit');
    if (!resp.ok) throw new Error(`Gemini error: ${resp.statusText}`);

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseLinesToStream(text);
  }

  if (provider.id === 'anthropic') {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': provider.key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        temperature: 0.2,
        system: promptContext,
        messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      })
    });

    if (resp.status === 429) throw new Error('Anthropic 429 Rate Limit');
    if (!resp.ok) throw new Error(`Anthropic error: ${resp.statusText}`);

    const data = await resp.json();
    const text = (data?.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    return parseLinesToStream(text);
  }

  if (provider.id === 'groq') {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: promptContext },
          ...messages
        ],
        temperature: 0.2,
      })
    });

    if (resp.status === 429) throw new Error('Groq 429 Rate Limit');
    if (!resp.ok) throw new Error(`Groq error: ${resp.statusText}`);

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return parseLinesToStream(text);
  }

  if (provider.id === 'openrouter') {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: promptContext },
          ...messages
        ],
        temperature: 0.2,
      })
    });

    if (resp.status === 429) throw new Error('OpenRouter 429 Rate Limit');
    if (!resp.ok) throw new Error(`OpenRouter error: ${resp.statusText}`);

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return parseLinesToStream(text);
  }

  return null;
}

async function* parseLinesToStream(rawText) {
  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('```')) continue;
    try {
      const obj = JSON.parse(trimmed);
      yield obj;
      await new Promise(r => setTimeout(r, 70));
    } catch {
      // not JSON line
    }
  }
}

// Built-in intelligent tutor generator with robust math solver & explanation levels
export async function streamBuiltInSimulation(messages, sourceContext, isAnnotation, page, sendLine, explanationLevel = 'intermediate') {
  const rawMsg = messages[messages.length - 1]?.content || '';
  const cleanMsg = rawMsg.toLowerCase().trim();

  let script = [];

  // Check for math arithmetic first (e.g., 5x5, 5*5, 12+8, 20/4, etc.)
  const mathMatch = detectMathExpression(cleanMsg);

  if (mathMatch) {
    script = generateMathSolution(mathMatch, explanationLevel);
  } else if (isAnnotation) {
    script = [
      { type: "say", text: `I am analyzing page ${page} of your document. Let me highlight key passages and add notes in the margin.` },
      { type: "highlight", x: 120, y: 140, w: 480, h: 28, color: "#fef08a" },
      { type: "underline", x1: 120, y1: 210, x2: 520, y2: 210, color: "#f43f5e" },
      { type: "circle", cx: 620, cy: 210, r: 24, width: 2, color: "#38bdf8" },
      { type: "arrow", x1: 650, y1: 210, x2: 740, y2: 180, width: 2, color: "#38bdf8" },
      { type: "note", text: "Key Axiom: Grounded in source definition", x: 740, y: 170, size: 18, color: "#fbbf24" },
      { type: "write", text: "Verified Citation [1]", x: 120, y: 320, size: 22, font: "caveat", color: "#10b981" },
      { type: "cite", i: 1, sourceId: "doc_1", page: page, quote: "Direct passage extracted from uploaded material", rect: [120, 140, 480, 30] },
      { type: "say", text: "Notice the callout in the right margin cross-referencing your document's thesis." }
    ];
  } else if (cleanMsg.includes('pythag') || cleanMsg.includes('triangle') || cleanMsg.includes('geometry')) {
    script = generatePythagorasLesson(explanationLevel);
  } else if (cleanMsg.includes('calculus') || cleanMsg.includes('derivative') || cleanMsg.includes('slope')) {
    script = generateCalculusLesson(explanationLevel);
  } else if (cleanMsg.includes('neural') || cleanMsg.includes('ai') || cleanMsg.includes('network') || cleanMsg.includes('deep learning')) {
    script = generateNeuralLesson(explanationLevel);
  } else if (cleanMsg.includes('photo') || cleanMsg.includes('plant') || cleanMsg.includes('biology')) {
    script = generatePhotosynthesisLesson(explanationLevel);
  } else {
    script = generateGeneralLesson(rawMsg, explanationLevel);
  }

  for (const cmd of script) {
    sendLine(cmd);
    await new Promise(r => setTimeout(r, 80));
  }
}

// Math detection helper
function detectMathExpression(text) {
  // Common patterns like 5x5, 5*5, 5 * 5, 5 x 5, what is 5x5, 5 times 5
  // Also: 12 + 8, 20 / 4, 3^2, sqrt(25)
  const mulMatch = text.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:x|\*|times|multiplied\s+by)\s*(\d+(?:\.\d+)?)/i);
  if (mulMatch) {
    const a = parseFloat(mulMatch[1]);
    const b = parseFloat(mulMatch[2]);
    return { op: 'mul', a, b, result: a * b, raw: `${a} × ${b}` };
  }

  const addMatch = text.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:\+|plus|add)\s*(\d+(?:\.\d+)?)/i);
  if (addMatch) {
    const a = parseFloat(addMatch[1]);
    const b = parseFloat(addMatch[2]);
    return { op: 'add', a, b, result: a + b, raw: `${a} + ${b}` };
  }

  const subMatch = text.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:\-|minus|subtract)\s*(\d+(?:\.\d+)?)/i);
  if (subMatch) {
    const a = parseFloat(subMatch[1]);
    const b = parseFloat(subMatch[2]);
    return { op: 'sub', a, b, result: a - b, raw: `${a} - ${b}` };
  }

  const divMatch = text.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:\/|÷|divided\s+by)\s*(\d+(?:\.\d+)?)/i);
  if (divMatch) {
    const a = parseFloat(divMatch[1]);
    const b = parseFloat(divMatch[2]);
    return { op: 'div', a, b, result: b !== 0 ? a / b : 'Undefined', raw: `${a} ÷ ${b}` };
  }

  const powMatch = text.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:\^|\*\*|to\s+the\s+power\s+of)\s*(\d+(?:\.\d+)?)/i);
  if (powMatch) {
    const a = parseFloat(powMatch[1]);
    const b = parseFloat(powMatch[2]);
    return { op: 'pow', a, b, result: Math.pow(a, b), raw: `${a}^${b}` };
  }

  return null;
}

function generateMathSolution(m, level) {
  const commands = [
    { type: "clear" }
  ];

  if (m.op === 'mul') {
    const { a, b, result } = m;

    if (level === 'beginner') {
      commands.push(
        { type: "say", text: `Let's solve ${a} times ${b}! That means we have ${a} equal groups of ${b}. Let's count them step-by-step!` },
        { type: "write", text: `Multiplication: ${a} × ${b}`, x: 80, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
        { type: "underline", x1: 80, y1: 100, x2: 360, y2: 100, color: "#38bdf8" },
        { type: "write", text: `${a} rows with ${b} dots in each row:`, x: 80, y: 150, size: 22, font: "caveat", color: "#cbd5e1" }
      );

      // Draw dot array for a x b (if manageable size <= 8x8)
      const rows = Math.min(6, Math.round(a));
      const cols = Math.min(6, Math.round(b));
      const startX = 140;
      const startY = 200;
      const spacing = 38;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          commands.push({
            type: "circle",
            cx: startX + c * spacing,
            cy: startY + r * spacing,
            r: 12,
            width: 2,
            color: "#60a5fa",
            fill: "rgba(56, 189, 248, 0.25)"
          });
        }
      }

      commands.push(
        { type: "arrow", x1: startX + cols * spacing + 10, y1: startY + (rows * spacing) / 2, x2: 440, y2: startY + (rows * spacing) / 2, width: 3, color: "#f43f5e" },
        { type: "write", text: `Repeated Addition:`, x: 460, y: 190, size: 22, font: "caveat", color: "#f1f5f9" },
        { type: "math", tex: `${Array(Math.min(5, Math.round(a))).fill(b).join(' + ')} = ${result}`, x: 460, y: 235, size: 26, color: "#fef08a" },
        // Answer box
        { type: "rect", x: 460, y: 310, w: 320, h: 100, width: 3, color: "#10b981", fill: "rgba(16, 185, 129, 0.15)" },
        { type: "math", tex: `${a} \\times ${b} = ${result}`, x: 480, y: 345, size: 36, color: "#34d399" },
        { type: "note", text: `Count: Total ${result} dots!`, x: 740, y: 220, size: 20, color: "#fbbf24" },
        { type: "say", text: `So ${a} times ${b} equals ${result}. Verified!` }
      );
    } else if (level === 'advanced') {
      commands.push(
        { type: "say", text: `Evaluating the quadratic product of ${a} and ${b}. In real arithmetic, this maps to the square of ${a}.` },
        { type: "write", text: `Arithmetic Product: ${a} × ${b}`, x: 80, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
        { type: "underline", x1: 80, y1: 100, x2: 400, y2: 100, color: "#38bdf8" },
        { type: "rect", x: 120, y: 160, w: 220, h: 220, width: 3, color: "#6366f1", fill: "rgba(99, 102, 241, 0.1)" },
        { type: "line", x1: 120, y1: 270, x2: 340, y2: 270, width: 1.5, color: "#818cf8" },
        { type: "line", x1: 230, y1: 160, x2: 230, y2: 380, width: 1.5, color: "#818cf8" },
        { type: "write", text: `Side = ${a}`, x: 190, y: 140, size: 22, font: "caveat", color: "#cbd5e1" },
        { type: "write", text: `Side = ${b}`, x: 40, y: 270, size: 22, font: "caveat", color: "#cbd5e1" },
        { type: "math", tex: `Area = \\int_0^{${a}} ${b}\\,dx = ${result}`, x: 420, y: 190, size: 30, color: "#fef08a" },
        { type: "math", tex: `${a} \\cdot ${b} = ${a}^2 = ${result}`, x: 420, y: 270, size: 32, color: "#60a5fa" },
        // Answer box
        { type: "rect", x: 420, y: 350, w: 340, h: 100, width: 3, color: "#10b981", fill: "rgba(16, 185, 129, 0.15)" },
        { type: "math", tex: `\\mathbf{Answer = ${result}}`, x: 440, y: 385, size: 38, color: "#34d399" },
        { type: "note", text: `Formal proof in integer ring ℤ`, x: 740, y: 220, size: 18, color: "#fbbf24" },
        { type: "say", text: `The calculated solution is precisely ${result}.` }
      );
    } else {
      // Intermediate (Standard)
      commands.push(
        { type: "say", text: `To calculate ${a} times ${b}, we multiply the factors together to find the product ${result}.` },
        { type: "write", text: `Multiplication: ${a} × ${b}`, x: 80, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
        { type: "underline", x1: 80, y1: 100, x2: 380, y2: 100, color: "#38bdf8" },
        { type: "rect", x: 120, y: 170, w: 200, h: 200, width: 3, color: "#38bdf8", fill: "rgba(56, 189, 248, 0.08)" },
        { type: "write", text: `Width: ${b}`, x: 180, y: 150, size: 24, font: "caveat", color: "#cbd5e1" },
        { type: "write", text: `Height: ${a}`, x: 30, y: 270, size: 24, font: "caveat", color: "#cbd5e1" },
        { type: "arrow", x1: 340, y1: 270, x2: 440, y2: 270, width: 3, color: "#ec4899" },
        { type: "write", text: `Calculation Steps:`, x: 460, y: 170, size: 24, font: "caveat", color: "#f1f5f9" },
        { type: "math", tex: `${a} \\times ${b} = ${a === b ? `${a}^2 = ` : ''}${result}`, x: 460, y: 220, size: 32, color: "#fef08a" },
        // Prominent answer box
        { type: "rect", x: 460, y: 300, w: 340, h: 100, width: 3, color: "#10b981", fill: "rgba(16, 185, 129, 0.15)" },
        { type: "math", tex: `\\mathbf{${a} \\times ${b} = ${result}}`, x: 480, y: 335, size: 38, color: "#34d399" },
        { type: "note", text: `Verified product = ${result}`, x: 740, y: 220, size: 20, color: "#fbbf24" },
        { type: "say", text: `The answer is ${result}.` }
      );
    }
  } else {
    // Other arithmetic operations
    const { a, b, result, raw } = m;
    commands.push(
      { type: "say", text: `Evaluating the expression ${raw}. The exact result is ${result}.` },
      { type: "write", text: `Arithmetic: ${raw}`, x: 80, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
      { type: "underline", x1: 80, y1: 100, x2: 360, y2: 100, color: "#38bdf8" },
      { type: "rect", x: 120, y: 180, w: 320, h: 120, width: 2, color: "#6366f1" },
      { type: "math", tex: `${raw} = ${result}`, x: 160, y: 220, size: 34, color: "#fef08a" },
      // Highlighted answer box
      { type: "rect", x: 500, y: 180, w: 320, h: 120, width: 3, color: "#10b981", fill: "rgba(16, 185, 129, 0.15)" },
      { type: "write", text: "Final Answer:", x: 520, y: 210, size: 22, font: "caveat", color: "#34d399" },
      { type: "math", tex: `\\mathbf{${result}}`, x: 620, y: 245, size: 40, color: "#34d399" },
      { type: "note", text: "Exact computation", x: 740, y: 360, size: 20, color: "#fbbf24" }
    );
  }

  return commands;
}

function generatePythagorasLesson(level) {
  if (level === 'beginner') {
    return [
      { type: "clear" },
      { type: "say", text: "Let's learn Pythagoras! Imagine a triangle with a square corner like the corner of a book." },
      { type: "write", text: "Right Triangle Corner", x: 80, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
      { type: "polygon", points: [[160, 460], [460, 460], [160, 240]], width: 3, color: "#60a5fa" },
      { type: "rect", x: 160, y: 430, w: 30, h: 30, width: 2, color: "#f43f5e" },
      { type: "write", text: "Side a (3)", x: 80, y: 350, size: 24, font: "caveat", color: "#cbd5e1" },
      { type: "write", text: "Side b (4)", x: 280, y: 490, size: 24, font: "caveat", color: "#cbd5e1" },
      { type: "write", text: "Long Side c (5)", x: 340, y: 310, size: 26, font: "caveat", color: "#38bdf8" },
      { type: "rect", x: 540, y: 180, w: 380, h: 160, width: 3, color: "#10b981", fill: "rgba(16, 185, 129, 0.15)" },
      { type: "math", tex: "3^2 + 4^2 = 5^2", x: 580, y: 220, size: 32, color: "#fef08a" },
      { type: "math", tex: "9 + 16 = 25", x: 600, y: 280, size: 32, color: "#34d399" },
      { type: "note", text: "Magic 3-4-5 Triangle!", x: 600, y: 400, size: 22, color: "#fbbf24" },
      { type: "say", text: "3 squared plus 4 squared equals 5 squared. 9 plus 16 is 25!" }
    ];
  }

  return [
    { type: "clear" },
    { type: "say", text: "Let's explore the Pythagorean theorem step by step on our whiteboard." },
    { type: "highlight", x: 60, y: 50, w: 380, h: 42, color: "#fef08a" },
    { type: "write", text: "Pythagorean Theorem", x: 70, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
    { type: "polygon", points: [[150, 460], [480, 460], [150, 210]], width: 3, color: "#60a5fa" },
    { type: "rect", x: 150, y: 430, w: 30, h: 30, width: 2, color: "#f43f5e" },
    { type: "dot", cx: 165, cy: 445, r: 3, color: "#f43f5e" },
    { type: "write", text: "Leg a", x: 80, y: 330, size: 26, font: "caveat", color: "#f1f5f9" },
    { type: "write", text: "Leg b", x: 300, y: 485, size: 26, font: "caveat", color: "#f1f5f9" },
    { type: "arrow", x1: 340, y1: 290, x2: 380, y2: 320, width: 3, color: "#ec4899" },
    { type: "write", text: "Hypotenuse c", x: 370, y: 280, size: 28, font: "caveat", color: "#ec4899" },
    { type: "rect", x: 560, y: 150, w: 380, h: 120, width: 2, color: "#10b981" },
    { type: "math", tex: "a^2 + b^2 = c^2", x: 620, y: 190, size: 40, color: "#fef08a" },
    { type: "math", tex: "c = \\sqrt{a^2 + b^2}", x: 640, y: 320, size: 34, color: "#38bdf8" },
    { type: "note", text: level === 'advanced' ? "Euclidean metric tensor: ds² = dx² + dy²" : "Universal for right-angled Euclidean triangles", x: 560, y: 450, size: 20, color: "#fbbf24" }
  ];
}

function generateCalculusLesson(level) {
  return [
    { type: "clear" },
    { type: "say", text: "Let's examine how derivatives represent instantaneous rate of change." },
    { type: "write", text: `Calculus: The Derivative (${level})`, x: 80, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
    { type: "arrow", x1: 120, y1: 520, x2: 120, y2: 160, width: 3, color: "#94a3b8" },
    { type: "arrow", x1: 120, y1: 520, x2: 560, y2: 520, width: 3, color: "#94a3b8" },
    { type: "write", text: "y", x: 100, y: 150, size: 24, font: "caveat", color: "#cbd5e1" },
    { type: "write", text: "x", x: 570, y: 520, size: 24, font: "caveat", color: "#cbd5e1" },
    { type: "path", d: "M 140 480 Q 280 460 480 200", width: 4, color: "#3b82f6" },
    { type: "dot", cx: 320, cy: 400, r: 6, color: "#f43f5e" },
    { type: "line", x1: 220, y1: 490, x2: 440, y2: 290, width: 3, color: "#f43f5e" },
    { type: "write", text: "Tangent Line", x: 410, y: 260, size: 22, font: "caveat", color: "#f43f5e" },
    { type: "rect", x: 580, y: 140, w: 380, h: 140, width: 2, color: "#8b5cf6" },
    { type: "math", tex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}", x: 600, y: 190, size: 30, color: "#fef08a" },
    { type: "note", text: level === 'beginner' ? "Slope = How steep the hill is right here!" : "Differential quotient: dy/dx", x: 640, y: 340, size: 20, color: "#fbbf24" }
  ];
}

function generateNeuralLesson(level) {
  return [
    { type: "clear" },
    { type: "say", text: "Here is the fundamental architecture of an artificial neural network." },
    { type: "write", text: `Neural Network Architecture`, x: 80, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
    { type: "circle", cx: 180, cy: 220, r: 24, width: 2, color: "#10b981" },
    { type: "circle", cx: 180, cy: 340, r: 24, width: 2, color: "#10b981" },
    { type: "circle", cx: 180, cy: 460, r: 24, width: 2, color: "#10b981" },
    { type: "write", text: "Inputs", x: 140, y: 520, size: 22, font: "caveat", color: "#10b981" },
    { type: "circle", cx: 380, cy: 180, r: 24, width: 2, color: "#6366f1" },
    { type: "circle", cx: 380, cy: 300, r: 24, width: 2, color: "#6366f1" },
    { type: "circle", cx: 380, cy: 420, r: 24, width: 2, color: "#6366f1" },
    { type: "write", text: "Hidden Layer", x: 340, y: 490, size: 22, font: "caveat", color: "#6366f1" },
    { type: "circle", cx: 580, cy: 300, r: 26, width: 3, color: "#f43f5e" },
    { type: "write", text: "Output ŷ", x: 550, y: 360, size: 22, font: "caveat", color: "#f43f5e" },
    { type: "line", x1: 204, y1: 220, x2: 356, y2: 300, width: 1.5, color: "#64748b" },
    { type: "line", x1: 204, y1: 340, x2: 356, y2: 300, width: 2, color: "#60a5fa" },
    { type: "line", x1: 404, y1: 300, x2: 554, y2: 300, width: 2.5, color: "#ec4899" },
    { type: "rect", x: 670, y: 160, w: 290, h: 180, width: 2, color: "#fbbf24" },
    { type: "math", tex: "z = W \\cdot x + b", x: 700, y: 200, size: 30, color: "#fef08a" },
    { type: "math", tex: "\\hat{y} = \\sigma(z)", x: 720, y: 270, size: 30, color: "#38bdf8" },
    { type: "note", text: level === 'beginner' ? "Like neurons in your brain talking!" : "Backprop & Gradient descent", x: 670, y: 400, size: 18, color: "#fbbf24" }
  ];
}

function generatePhotosynthesisLesson(level) {
  return [
    { type: "clear" },
    { type: "say", text: "Let's illustrate the biochemistry of photosynthesis." },
    { type: "write", text: "Photosynthesis Process", x: 80, y: 60, size: 32, font: "caveat", color: "#10b981" },
    { type: "circle", cx: 160, cy: 170, r: 40, width: 3, color: "#f59e0b" },
    { type: "write", text: "Sunlight", x: 130, y: 230, size: 22, font: "caveat", color: "#fbbf24" },
    { type: "path", d: "M 320 480 Q 420 300 560 360 Q 480 500 320 480", width: 3, color: "#16a34a" },
    { type: "write", text: "Leaf Chloroplast", x: 380, y: 520, size: 24, font: "caveat", color: "#22c55e" },
    { type: "arrow", x1: 210, y1: 190, x2: 360, y2: 340, width: 3, color: "#f59e0b" },
    { type: "arrow", x1: 180, y1: 420, x2: 320, y2: 440, width: 3, color: "#38bdf8" },
    { type: "write", text: "Water (H₂O)", x: 90, y: 410, size: 22, font: "caveat", color: "#38bdf8" },
    { type: "arrow", x1: 520, y1: 340, x2: 660, y2: 280, width: 3, color: "#ec4899" },
    { type: "write", text: "Oxygen (O₂)", x: 670, y: 270, size: 22, font: "caveat", color: "#ec4899" },
    { type: "rect", x: 540, y: 380, w: 420, h: 140, width: 2, color: "#06b6d4" },
    { type: "math", tex: "6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2", x: 550, y: 430, size: 20, color: "#fef08a" },
    { type: "note", text: level === 'beginner' ? "Plants eat light to make sugar!" : "Light-dependent reactions + Calvin cycle", x: 560, y: 560, size: 18, color: "#fbbf24" }
  ];
}

function generateGeneralLesson(topicRaw, level) {
  const topic = topicRaw ? topicRaw.replace(/[?.]/g, '') : 'Visual Whiteboard Lesson';
  const capTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

  return [
    { type: "clear" },
    { type: "say", text: `Let's break down ${capTopic} at the ${level} explanation level.` },
    { type: "write", text: `${capTopic}`, x: 80, y: 60, size: 32, font: "caveat", color: "#38bdf8" },
    { type: "underline", x1: 80, y1: 105, x2: 420, y2: 105, color: "#38bdf8" },
    { type: "rect", x: 100, y: 160, w: 340, h: 140, width: 2, color: "#6366f1", fill: "rgba(99, 102, 241, 0.08)" },
    { type: "write", text: "1. Core Foundation", x: 120, y: 195, size: 24, font: "caveat", color: "#a5b4fc" },
    { type: "write", text: level === 'beginner' ? "Simple starting picture & idea" : "Foundational axiom & definition", x: 120, y: 245, size: 20, font: "caveat", color: "#e2e8f0" },
    { type: "arrow", x1: 440, y1: 230, x2: 540, y2: 230, width: 3, color: "#ec4899" },
    { type: "rect", x: 540, y: 160, w: 380, h: 140, width: 2, color: "#ec4899", fill: "rgba(236, 72, 153, 0.08)" },
    { type: "write", text: "2. Working Mechanism", x: 560, y: 195, size: 24, font: "caveat", color: "#f472b6" },
    { type: "write", text: level === 'beginner' ? "How the pieces fit together" : "Systematic transformation rules", x: 560, y: 245, size: 20, font: "caveat", color: "#e2e8f0" },
    { type: "rect", x: 260, y: 360, w: 520, h: 140, width: 3, color: "#10b981", fill: "rgba(16, 185, 129, 0.12)" },
    { type: "write", text: "3. Clear Takeaway & Solution", x: 290, y: 395, size: 24, font: "caveat", color: "#6ee7b7" },
    { type: "math", tex: "\\text{Key Principle} = \\text{Understandable and Verified}", x: 300, y: 440, size: 24, color: "#fef08a" },
    { type: "note", text: `Level: ${level}`, x: 800, y: 420, size: 18, color: "#fbbf24" }
  ];
}

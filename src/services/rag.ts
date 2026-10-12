// src/services/rag.ts
// Client-side document chunking, hybrid search, and citation matcher
import type { Chunk, SourceMeta } from '../types/tutor';

export function chunkDocument(sourceId: string, sourceName: string, text: string, chunkSize = 450, overlap = 80): Chunk[] {
  const chunks: Chunk[] = [];
  if (!text || text.trim().length === 0) return chunks;

  // Split text by paragraphs or sentences
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if ((currentChunk + ' ' + para).length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `${sourceId}_chunk_${chunkIndex++}`,
        sourceId,
        sourceName,
        text: currentChunk.trim(),
        score: 0
      });
      // Keep overlap from previous chunk
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 6)).join(' ');
      currentChunk = overlapWords + ' ' + para;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n${para}` : para;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${sourceId}_chunk_${chunkIndex++}`,
      sourceId,
      sourceName,
      text: currentChunk.trim(),
      score: 0
    });
  }

  return chunks;
}

export function searchChunks(query: string, sources: SourceMeta[], topK = 5): Chunk[] {
  const queryTokens = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return [];

  const allChunks: Chunk[] = [];
  for (const s of sources) {
    if (s.selected && s.chunks) {
      allChunks.push(...s.chunks);
    }
  }

  if (allChunks.length === 0) return [];

  // TF-IDF / BM25-style scoring
  const scored = allChunks.map(chunk => {
    const chunkText = chunk.text.toLowerCase();
    let score = 0;

    for (const token of queryTokens) {
      if (chunkText.includes(token)) {
        // Frequency boost
        const regex = new RegExp(`\\b${token}\\b`, 'g');
        const matches = (chunkText.match(regex) || []).length;
        score += 1 + matches * 0.5;
        // Exact boundary boost
        if (chunkText.indexOf(token) !== -1) {
          score += 0.5;
        }
      }
    }

    return { ...chunk, score };
  });

  return scored
    .filter(c => (c.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topK);
}

export function buildGroundingContext(matchedChunks: Chunk[]): string {
  if (!matchedChunks.length) return '';
  return matchedChunks
    .map((c, idx) => `[Source ${idx + 1}: ${c.sourceName || c.sourceId}]\n"${c.text}"`)
    .join('\n\n');
}

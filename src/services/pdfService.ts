// src/services/pdfService.ts
// PDF rendering with pdfjs-dist, text extraction, and export with pdf-lib
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import type { SourceMeta, SourcePage, DrawCommand } from '../types/tutor';
import { chunkDocument } from './rag';

// Set up worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('Worker configuration notice:', e);
}

export async function ingestPDFFile(file: File): Promise<SourceMeta> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const pages: SourcePage[] = [];
  let fullText = '';

  for (let i = 1; i <= Math.min(numPages, 20); i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      await (page.render({ canvasContext: ctx, viewport, canvas } as any).promise);
    }

    const textContent = await page.getTextContent();
    const pageStrings = textContent.items
      .map((item: any) => item.str || '')
      .filter(Boolean);
    const pageText = pageStrings.join(' ');
    fullText += `\n--- Page ${i} ---\n` + pageText;

    pages.push({
      pageNumber: i,
      text: pageText,
      dataUrl: canvas.toDataURL('image/jpeg', 0.85),
      width: viewport.width,
      height: viewport.height
    });
  }

  const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chunks = chunkDocument(id, file.name, fullText);

  return {
    id,
    name: file.name,
    kind: 'pdf',
    pageCount: numPages,
    text: fullText,
    pages,
    chunks,
    selected: true,
    summary: fullText.slice(0, 180) + '...'
  };
}

export async function ingestTextFile(file: File): Promise<SourceMeta> {
  const text = await file.text();
  const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chunks = chunkDocument(id, file.name, text);

  return {
    id,
    name: file.name,
    kind: file.name.endsWith('.md') ? 'md' : 'txt',
    pageCount: 1,
    text,
    chunks,
    selected: true,
    summary: text.slice(0, 180) + '...'
  };
}

export async function exportAnnotatedPDF(originalFileBuffer: ArrayBuffer | null, commands: DrawCommand[]): Promise<Uint8Array> {
  let pdfDoc: PDFDocument;

  if (originalFileBuffer) {
    try {
      pdfDoc = await PDFDocument.load(originalFileBuffer);
    } catch {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([1000, 700]);
    }
  } else {
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([1000, 700]);
  }

  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();
  const scaleX = width / 1000;
  const scaleY = height / 700;

  for (const cmd of commands) {
    if (cmd.type === 'highlight') {
      page.drawRectangle({
        x: cmd.x * scaleX,
        y: height - (cmd.y + cmd.h) * scaleY,
        width: cmd.w * scaleX,
        height: cmd.h * scaleY,
        color: rgb(1, 0.93, 0.5),
        opacity: 0.45,
      });
    } else if (cmd.type === 'rect') {
      page.drawRectangle({
        x: cmd.x * scaleX,
        y: height - (cmd.y + cmd.h) * scaleY,
        width: cmd.w * scaleX,
        height: cmd.h * scaleY,
        borderColor: rgb(0.2, 0.4, 0.8),
        borderWidth: (cmd.width || 2) * scaleX,
        opacity: 0.8,
      });
    } else if (cmd.type === 'line' || cmd.type === 'underline') {
      const x1 = (cmd.type === 'underline' ? cmd.x1 : cmd.x1) * scaleX;
      const y1 = height - (cmd.type === 'underline' ? cmd.y2 : cmd.y1) * scaleY;
      const x2 = (cmd.type === 'underline' ? cmd.x2 : cmd.x2) * scaleX;
      const y2 = height - (cmd.type === 'underline' ? cmd.y2 : cmd.y2) * scaleY;
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        color: rgb(0.9, 0.2, 0.2),
        thickness: 2 * scaleX,
      });
    }
  }

  return await pdfDoc.save();
}

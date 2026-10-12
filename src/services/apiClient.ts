// src/services/apiClient.ts
// Client-side API caller for /api/tutor streaming JSONL commands
import type { DrawCommand, TutorSettings, Message } from '../types/tutor';

export interface StreamCallbacks {
  onCommand: (cmd: DrawCommand) => void;
  onStatus?: (status: { provider: string; message: string }) => void;
  onError?: (err: any) => void;
  onDone?: () => void;
}

export async function streamTutorCommands(
  messages: { role: string; content: string }[],
  settings: TutorSettings,
  sourceContext: string | null,
  isAnnotation: boolean,
  page: number,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        provider: settings.provider,
        keys: settings.keys,
        explanationLevel: settings.explanationLevel || 'intermediate',
        sourceContext,
        isAnnotation,
        page
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body has no reader');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data:')) {
          const dataContent = trimmed.substring(5).trim();
          if (dataContent === '[DONE]') {
            callbacks.onDone?.();
            return;
          }

          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.t === 'status') {
              callbacks.onStatus?.({ provider: parsed.provider, message: parsed.message });
            } else if (parsed.type) {
              callbacks.onCommand(parsed as DrawCommand);
            }
          } catch {
            // Ignore non-json messages
          }
        }
      }
    }

    callbacks.onDone?.();
  } catch (error) {
    console.warn('Network error or offline mode, falling back to client engine:', error);
    callbacks.onError?.(error);
  }
}

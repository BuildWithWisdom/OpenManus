export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

const HONO_API_URL = import.meta.env.VITE_HONO_API_URL || 'http://localhost:8787';

export async function streamLLMMessage(
  requestId: string,
  messages: Array<{ role: string; content: string }>,
  modelName: string,
  providerSlug?: string,
  callbacks?: StreamCallbacks,
  personaId?: string
): Promise<void> {
  let hasEmittedChunk = false;
  let isThinking = false;

  console.log('[LLM Client] Sending request to:', `${HONO_API_URL}/api/chat/stream`, { modelName, providerSlug });

  try {
    const response = await fetch(`${HONO_API_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        modelName,
        providerSlug,
        personaId: personaId || 'default',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      console.error('[LLM Client HTTP Error]:', response.status, errorData);
      callbacks?.onError(errorData.error || `HTTP ${response.status}`);
      return;
    }

    if (!response.body) {
      callbacks?.onError('Response body is null');
      return;
    }

    const reader = response.body.getReader();
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
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        if (trimmed === 'data: [DONE]') break;

        try {
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;
          const parsed = JSON.parse(jsonStr);

          const delta = parsed.choices?.[0]?.delta;
          const contentChunk: string | undefined =
            delta?.content || parsed.response || parsed.result?.response;
          const reasoningChunk: string | undefined =
            delta?.reasoning_content || delta?.reasoning;

          if (reasoningChunk) {
            if (!hasEmittedChunk) hasEmittedChunk = true;
            if (!isThinking) {
              isThinking = true;
              callbacks?.onChunk('<think>\n');
            }
            callbacks?.onChunk(reasoningChunk);
          }

          if (contentChunk) {
            if (!hasEmittedChunk) hasEmittedChunk = true;
            if (isThinking) {
              isThinking = false;
              callbacks?.onChunk('\n</think>\n\n');
            }
            callbacks?.onChunk(contentChunk);
          }
        } catch {
          // If response is raw streamed text chunk instead of SSE JSON
          if (!hasEmittedChunk) hasEmittedChunk = true;
          callbacks?.onChunk(trimmed.slice(5).trim());
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:')) {
        try {
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr && jsonStr !== '[DONE]') {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            const contentChunk = delta?.content || parsed.response || parsed.result?.response;
            const reasoningChunk = delta?.reasoning_content || delta?.reasoning;

            if (reasoningChunk) {
              if (!hasEmittedChunk) hasEmittedChunk = true;
              if (!isThinking) {
                isThinking = true;
                callbacks?.onChunk('<think>\n');
              }
              callbacks?.onChunk(reasoningChunk);
            }
            if (contentChunk) {
              if (!hasEmittedChunk) hasEmittedChunk = true;
              if (isThinking) {
                isThinking = false;
                callbacks?.onChunk('\n</think>\n\n');
              }
              callbacks?.onChunk(contentChunk);
            }
          }
        } catch {
          if (!hasEmittedChunk) hasEmittedChunk = true;
          callbacks?.onChunk(trimmed.slice(5).trim());
        }
      }
    }

    if (isThinking) {
      isThinking = false;
      callbacks?.onChunk('\n</think>\n\n');
    }

    callbacks?.onComplete();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Connection failed';
    callbacks?.onError(errorMsg);
  }
}

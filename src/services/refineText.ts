// ============================================================
// DreamBound — Text Refinement Service
// Cleans raw transcription text using GPT-4o-mini
// ============================================================

import { AI_CONFIG } from '../constants/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RefinementResult {
  cleanedText: string;
  rawText: string;
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Mock Refinement (for development without API key)
// ---------------------------------------------------------------------------

const FILLER_WORDS = [
  'um', 'uh', 'uhm', 'hmm', 'er', 'ah',
  'like', 'you know', 'i mean', 'sort of', 'kind of',
  'basically', 'actually', 'literally', 'right',
  'so', 'well', 'okay', 'ok',
];

function mockRefineText(rawText: string): string {
  let text = rawText;

  // Remove filler words (case-insensitive, word-boundary aware)
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b[,.]?\\s*`, 'gi');
    text = text.replace(regex, ' ');
  }

  // Remove repeated words ("I I I" → "I")
  text = text.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // Remove trailing/leading whitespace, collapse multiple spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Ensure it ends with punctuation
  if (text.length > 0 && !/[.!?]$/.test(text)) {
    text += '.';
  }

  return text;
}

// ---------------------------------------------------------------------------
// Real API Refinement (OpenAI-compatible — works with Groq, OpenAI, etc.)
// ---------------------------------------------------------------------------

const REFINEMENT_SYSTEM_PROMPT = `You are a text cleanup assistant for a dream journal app. Your job is to clean up raw speech-to-text transcriptions.

RULES (strictly follow all):
1. Remove filler words: "um", "uh", "uhm", "hmm", "like", "you know", "I mean", "sort of", "kind of", "basically", "actually"
2. Remove false starts and repeated phrases
3. Fix obvious grammar and punctuation
4. Preserve the user's voice, word choices, and meaning
5. Do NOT add any content that wasn't said
6. Do NOT interpret or embellish
7. Do NOT change the emotional tone
8. Do NOT over-formalize casual speech
9. Keep it natural and readable
10. Return ONLY the cleaned text, nothing else`;

async function callRefinementAPI(
  rawText: string,
  apiKey: string,
  apiBaseUrl: string,
  model: string,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // 10s hard timeout

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // OpenRouter requires HTTP-Referer header
  if (apiBaseUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'https://dreambound.app';
    headers['X-Title'] = 'DreamBound';
  }

  try {
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: REFINEMENT_SYSTEM_PROMPT },
          { role: 'user', content: rawText },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const cleaned = data.choices?.[0]?.message?.content?.trim();

    if (!cleaned) {
      throw new Error('Empty response from refinement API');
    }

    return cleaned;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Refine raw transcription text by removing filler words and cleaning up grammar.
 *
 * - In mock mode (no API key or useMock=true): uses local regex cleanup
 * - In real mode: calls OpenAI-compatible API (OpenAI, Groq, etc.)
 *
 * On failure, returns the raw text unchanged so the user can edit manually.
 */
export async function refineTranscription(
  rawText: string,
  options?: {
    apiKey?: string;
    apiBaseUrl?: string;
    model?: string;
    useMock?: boolean;
  },
): Promise<RefinementResult> {
  if (!rawText.trim()) {
    return { cleanedText: '', rawText, success: false, error: 'Empty input' };
  }

  const useMock = options?.useMock ?? !options?.apiKey;

  // Mock mode: local regex cleanup
  if (useMock) {
    return {
      cleanedText: mockRefineText(rawText),
      rawText,
      success: true,
    };
  }

  // Real API mode
  try {
    const cleanedText = await callRefinementAPI(
      rawText,
      options!.apiKey!,
      options?.apiBaseUrl ?? 'https://api.openai.com/v1',
      options?.model ?? 'gpt-4o-mini',
    );

    return { cleanedText, rawText, success: true };
  } catch (err: any) {
    console.warn('[refineText] API call failed, returning raw text:', err.message);
    // Fallback: return raw text so user can edit manually
    return {
      cleanedText: rawText,
      rawText,
      success: false,
      error: err.message ?? 'Refinement failed',
    };
  }
}

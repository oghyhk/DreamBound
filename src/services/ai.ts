// ============================================================
// DreamBound — AI Interpretation Service
// Supports real OpenAI API or mock mode for development
// ============================================================

import type { Dream, Interpretation, AiModel } from '../types';
import { AI_CONFIG } from '../constants/config';
import { generateMockInterpretation } from './mockAi';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface InterpretDreamOptions {
  dream: Dream;
  model: AiModel;
  useMock: boolean;
  apiKey?: string;
}

export async function interpretDream(
  options: InterpretDreamOptions,
): Promise<Interpretation> {
  const { dream, model, useMock, apiKey } = options;

  if (useMock || !apiKey) {
    return generateMockInterpretation(dream);
  }

  return callOpenAI(dream, model, apiKey);
}

// ---------------------------------------------------------------------------
// Real OpenAI Integration
// ---------------------------------------------------------------------------

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callOpenAI(
  dream: Dream,
  model: AiModel,
  apiKey: string,
): Promise<Interpretation> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(dream);

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= AI_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model === 'claude' ? 'gpt-4o' : model,
          messages,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      return parseInterpretationResponse(content, model);
    } catch (err) {
      lastError = err as Error;
      if (attempt < AI_CONFIG.maxRetries) {
        await sleep(AI_CONFIG.retryDelayMs * Math.pow(2, attempt));
      }
    }
  }

  // Fallback to mock on persistent failure
  console.warn('[AI] OpenAI call failed, falling back to mock:', lastError?.message);
  return generateMockInterpretation(dream);
}

function buildSystemPrompt(): string {
  return `You are an expert dream analyst specializing in psychological dream interpretation, drawing from Jungian psychology, psychoanalysis, and modern cognitive science. Your role is to provide thoughtful, personalized dream analysis that helps the dreamer understand their subconscious patterns.

When analyzing dreams:
1. Focus on universal symbols AND personal context
2. Identify recurring themes and emotional patterns
3. Connect dream imagery to the dreamer's waking life where possible
4. Be compassionate and non-judgmental, especially for distressing dreams
5. Provide actionable reflection prompts when appropriate

Respond ONLY with a valid JSON object in this exact format:
{
  "summary": "A 2-3 sentence overview of the dream's primary meaning",
  "themes": ["theme1", "theme2", "theme3"],
  "symbols": [
    {
      "name": "symbol name",
      "meaning": "general psychological meaning",
      "personalContext": "what this might specifically mean for this dreamer",
      "occurrences": 1
    }
  ],
  "emotionalAnalysis": "Analysis of the emotional landscape of the dream",
  "lucidityAnalysis": "If the dream was lucid, what this awareness might signify",
  "advice": "A brief reflective question or prompt for the dreamer"
}`;
}

function buildUserPrompt(dream: Dream): string {
  const emotionList = dream.emotions.length > 0
    ? dream.emotions.join(', ')
    : 'not specified';

  const tags = dream.tags.length > 0
    ? dream.tags.join(', ')
    : 'none';

  return `Please analyze the following dream:

Title: ${dream.title}
Date: ${new Date(dream.createdAt).toLocaleDateString()}

Dream Content:
${dream.content}

Emotions felt in dream: ${emotionList}
Tags: ${tags}
Lucid dream: ${dream.isLucid ? 'Yes' : 'No'}
Nightmare: ${dream.isNightmare ? 'Yes' : 'No'}

Provide a thoughtful, personalized interpretation.`;
}

function parseInterpretationResponse(
  content: string,
  model: string,
): Interpretation {
  try {
    const parsed = JSON.parse(content);

    const interpretation: Interpretation = {
      generatedAt: new Date().toISOString(),
      model,
      summary: parsed.summary ?? 'Unable to generate summary.',
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      symbols: Array.isArray(parsed.symbols)
        ? parsed.symbols.map((s: Record<string, unknown>) => ({
            name: String(s.name ?? 'Unknown'),
            meaning: String(s.meaning ?? ''),
            personalContext: String(s.personalContext ?? ''),
            occurrences: Number(s.occurrences ?? 1),
          }))
        : [],
      emotionalAnalysis: parsed.emotionalAnalysis ?? '',
      lucidityAnalysis: parsed.lucidityAnalysis ?? '',
      advice: parsed.advice ?? '',
    };

    return interpretation;
  } catch {
    // If JSON parsing fails, return a graceful fallback
    return {
      generatedAt: new Date().toISOString(),
      model,
      summary: content.slice(0, 300),
      themes: [],
      symbols: [],
      emotionalAnalysis: '',
      lucidityAnalysis: '',
      advice: '',
    };
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

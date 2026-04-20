// ============================================================
// DreamBound — App Configuration
// ============================================================

import type { UserPreferences, Emotion } from '../types';
import { SECRETS } from './secrets';

// Storage keys
export const STORAGE_KEYS = {
  DREAMS: 'dreambound:dreams',
  SLEEP_ENTRIES: 'dreambound:sleep_entries',
  PROFILE: 'dreambound:profile',
  PREFERENCES: 'dreambound:preferences',
  LAST_SYNC: 'dreambound:last_sync',
} as const;

// Default preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  notificationsEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  lucidRemindersInterval: 4, // hours, 0 = disabled
  defaultEmotions: ['joy', 'sadness', 'fear', 'confusion', 'calm', 'anxiety', 'surprise', 'anger'],
  language: 'en',
  useMockAI: true,
  aiModel: 'gpt-4o-mini',
  dreamWallEnabled: false,
};

// AI Configuration
export const AI_CONFIG = {
  // Free tier interpretation limit per month
  FREE_INTERPRETATION_LIMIT: 3,
  // Retry settings
  maxRetries: 2,
  retryDelayMs: 1000,
  // Model pricing (for future cost tracking)
  models: {
    'gpt-4o': { inputCostPer1M: 2.5, outputCostPer1M: 10 },
    'gpt-4o-mini': { inputCostPer1M: 0.15, outputCostPer1M: 0.6 },
    'claude': { inputCostPer1M: 3, outputCostPer1M: 15 },
  },
} as const;

// API Keys (from local secrets.ts, not committed to git)
export const API_KEYS = {
  groq: SECRETS.groqApiKey,
  openrouter: SECRETS.openrouterApiKey,
} as const;

// Speech-to-Text Configuration (Groq Whisper)
export const STT_CONFIG = {
  // Groq API (default) — OpenAI-compatible, 3.2x cheaper than OpenAI
  defaultProvider: 'groq' as const,
  providers: {
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'whisper-large-v3',
      costPerMinute: 0.00185, // USD
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'whisper-1',
      costPerMinute: 0.006,
    },
  },
  // Request settings
  timeoutMs: 30_000,
} as const;

// Text Refinement Configuration (OpenRouter mimo-v2-flash)
export const REFINEMENT_CONFIG = {
  defaultProvider: 'openrouter' as const,
  providers: {
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'qwen/qwen-2.5-7b-instruct',
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.1-8b-instant',
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    },
  },
  // Request settings
  temperature: 0,
  maxTokens: 500,
  timeoutMs: 10_000,
} as const;

// Audio Recording Configuration
export const AUDIO_CONFIG = {
  maxRecordingDurationSeconds: 300, // 5 minutes
  audioFileExtension: 'm4a',
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 128000,
} as const;

// Dream entry
export const DREAM_ENTRY_CONFIG = {
  autoSaveIntervalMs: 3000,
  maxTitleLength: 80,
  maxContentLength: 10000,
  maxTags: 10,
  maxEmotions: 3,
  autoTitleWordCount: 6,
} as const;

// Pagination
export const PAGINATION = {
  dreamsPerPage: 20,
  insightsSymbolsLimit: 10,
  recentDreamsCount: 5,
} as const;

// Notification channels (Android)
export const NOTIFICATION_CHANNELS = {
  LUCID_REMINDER: 'lucid-reminder',
  MORNING_REMINDER: 'morning-reminder',
  INTERPRETATION_READY: 'interpretation-ready',
} as const;

// Emotion labels (for display)
export const EMOTION_LABELS: Record<Emotion, string> = {
  joy: 'Joy',
  sadness: 'Sadness',
  fear: 'Fear',
  anger: 'Anger',
  surprise: 'Surprise',
  confusion: 'Confusion',
  calm: 'Calm',
  anxiety: 'Anxiety',
};

// Supported languages (future)
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
] as const;

// Premium features
export const PREMIUM_FEATURES = {
  unlimitedInterpretations: true,
  fullInsights: true,
  advancedSleepTracking: true,
  lucidTools: true,
  prioritySupport: true,
  earlyAccess: true,
} as const;

// App Info
export const APP_INFO = {
  name: 'DreamBound',
  version: '1.0.0',
  buildNumber: 1,
  bundleId: {
    ios: 'com.dreambound.app',
    android: 'com.dreambound.app',
  },
} as const;

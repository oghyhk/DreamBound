// ============================================================
// DreamBound — Dream Engine
// Core business logic for dream CRUD, analysis, and insights
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type {
  Dream,
  DreamSymbol,
  CreateDreamInput,
  UpdateDreamInput,
  SymbolFrequency,
  EmotionTrend,
  DreamStatistics,
  SleepEntry,
  Interpretation,
  Emotion,
} from '../types';
import { DREAM_ENTRY_CONFIG } from '../constants/config';
import { interpretDream } from './ai';
import { saveAudioFile, deleteAudioFile, generateAudioFilename } from './storage';

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

export function createDream(input: CreateDreamInput): Dream {
  const now = new Date().toISOString();
  const title = input.title?.trim() || generateTitle(input.content);

  const dream: Dream = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    title,
    content: input.content.trim(),
    audioUri: undefined,
    audioDuration: undefined,
    emotions: input.emotions ?? [],
    tags: normalizeTags(input.tags ?? []),
    isLucid: input.isLucid ?? false,
    isNightmare: input.isNightmare ?? false,
    interpretation: undefined,
    editHistory: [],
  };

  return dream;
}

export function updateDream(dream: Dream, input: UpdateDreamInput): Dream {
  const now = new Date().toISOString();

  // Save edit history if content changed
  const editHistory = [...dream.editHistory];
  if (input.content !== undefined && input.content !== dream.content) {
    editHistory.push({
      editedAt: dream.updatedAt,
      content: dream.content,
    });
    // Keep only last 10 edits
    if (editHistory.length > 10) {
      editHistory.splice(0, editHistory.length - 10);
    }
  }

  return {
    ...dream,
    ...(input.title !== undefined && { title: input.title.trim() || generateTitle(dream.content) }),
    ...(input.content !== undefined && { content: input.content.trim() }),
    ...(input.emotions !== undefined && { emotions: input.emotions }),
    ...(input.tags !== undefined && { tags: normalizeTags(input.tags) }),
    ...(input.isLucid !== undefined && { isLucid: input.isLucid }),
    ...(input.isNightmare !== undefined && { isNightmare: input.isNightmare }),
    editHistory,
    updatedAt: now,
  };
}

export async function attachAudio(
  dream: Dream,
  audioUri: string,
  duration: number,
): Promise<Dream> {
  const filename = generateAudioFilename();
  const savedUri = await saveAudioFile(audioUri, filename);
  return {
    ...dream,
    audioUri: savedUri,
    audioDuration: duration,
  };
}

export async function removeAudio(dream: Dream): Promise<Dream> {
  if (dream.audioUri) {
    await deleteAudioFile(dream.audioUri);
  }
  const { audioUri: _removed, audioDuration: _removedDur, ...rest } = dream;
  return rest as Dream;
}

// ---------------------------------------------------------------------------
// AI Interpretation
// ---------------------------------------------------------------------------

export async function runInterpretation(
  dream: Dream,
  useMock: boolean,
  aiModel: 'gpt-4o' | 'gpt-4o-mini' | 'claude',
  apiKey?: string,
): Promise<Interpretation> {
  return interpretDream({
    dream,
    model: aiModel,
    useMock,
    apiKey,
  });
}

// ---------------------------------------------------------------------------
// Analysis & Insights
// ---------------------------------------------------------------------------

export function extractSymbols(dreams: Dream[]): SymbolFrequency[] {
  // Simple keyword-based symbol extraction
  const symbolCounts: Record<string, { count: number; recentDreams: string[] }> = {};

  const keywords = [
    'water', 'ocean', 'river', 'lake', 'rain', 'sea',
    'falling', 'fly', 'flying', 'chase', 'run',
    'house', 'home', 'room', 'door', 'window',
    'snake', 'dog', 'cat', 'bird', 'horse', 'bear',
    'car', 'bus', 'train', 'plane', 'bike',
    'forest', 'tree', 'flower', 'grass', 'mountain',
    'beach', 'sand', 'wave', 'sun', 'moon', 'star',
    'child', 'baby', 'mother', 'father', 'family',
    'death', 'die', 'ghost', 'monster', 'zombie',
    'school', 'work', 'office', 'church',
    'bridge', 'road', 'path', 'street',
    'mirror', 'face', 'eye', 'hand',
    'fire', 'wind', 'storm', 'snow',
  ];

  for (const dream of dreams) {
    const content = dream.content.toLowerCase();
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        if (!symbolCounts[keyword]) {
          symbolCounts[keyword] = { count: 0, recentDreams: [] };
        }
        symbolCounts[keyword].count++;
        if (symbolCounts[keyword].recentDreams.length < 3) {
          symbolCounts[keyword].recentDreams.push(dream.id);
        }
      }
    }
  }

  return Object.entries(symbolCounts)
    .map(([symbol, data]) => ({
      symbol,
      count: data.count,
      trend: 'stable' as const,
      recentDreams: data.recentDreams,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getEmotionTrends(dreams: Dream[]): EmotionTrend[] {
  const emotionCounts: Record<Emotion, number> = {
    joy: 0, sadness: 0, fear: 0, anger: 0,
    surprise: 0, confusion: 0, calm: 0, anxiety: 0,
  };

  for (const dream of dreams) {
    for (const emotion of dream.emotions) {
      emotionCounts[emotion]++;
    }
  }

  const total = Math.max(Object.values(emotionCounts).reduce((a, b) => a + b, 0), 1);

  return Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion: emotion as Emotion,
    count,
    percentage: Math.round((count / total) * 100),
    trend: 'stable' as const,
  }));
}

export function getStatistics(dreams: Dream[], _sleepEntries?: SleepEntry[]): DreamStatistics {
  if (dreams.length === 0) {
    return {
      totalDreams: 0,
      averagePerWeek: 0,
      lucidPercentage: 0,
      nightmarePercentage: 0,
      mostActiveHour: null,
      mostCommonEmotion: null,
      currentStreak: 0,
      longestStreak: 0,
      topSymbols: [],
      emotionDistribution: [],
    };
  }

  const total = dreams.length;
  const lucidCount = dreams.filter((d) => d.isLucid).length;
  const nightmareCount = dreams.filter((d) => d.isNightmare).length;

  // Average per week (assuming 7 days of data or all-time)
  const dates = dreams.map((d) => parseISO(d.createdAt));
  const newest = dates.reduce((a, b) => (a > b ? a : b));
  const oldest = dates.reduce((a, b) => (a < b ? a : b));
  const daysSpan = Math.max(1, Math.ceil((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24)));
  const weeks = Math.max(1, daysSpan / 7);
  const averagePerWeek = Math.round((total / weeks) * 10) / 10;

  // Most common emotion
  const emotionTrends = getEmotionTrends(dreams);
  const mostCommon = emotionTrends.reduce(
    (max, curr) => (curr.count > max.count ? curr : max),
    { emotion: null as Emotion | null, count: 0, percentage: 0, trend: 'stable' as const },
  );

  // Most active hour
  const hourCounts: Record<number, number> = {};
  for (const dream of dreams) {
    const hour = parseISO(dream.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  const mostActiveHour = Object.entries(hourCounts).reduce(
    (max, [hour, count]) => (count > max.count ? { hour: Number(hour), count } : max),
    { hour: -1, count: 0 },
  ).hour;
  const mostActiveHourFinal = mostActiveHour === -1 ? null : mostActiveHour;

  // Streaks
  const { currentStreak, longestStreak } = calculateStreaks(dreams);

  // Top symbols
  const topSymbols = extractSymbols(dreams).slice(0, 10);

  return {
    totalDreams: total,
    averagePerWeek,
    lucidPercentage: Math.round((lucidCount / total) * 100),
    nightmarePercentage: Math.round((nightmareCount / total) * 100),
    mostActiveHour: mostActiveHourFinal,
    mostCommonEmotion: mostCommon.emotion,
    currentStreak,
    longestStreak,
    topSymbols,
    emotionDistribution: emotionTrends.filter((e) => e.count > 0),
  };
}

export function calculateStreaks(dreams: Dream[]): { currentStreak: number; longestStreak: number } {
  if (dreams.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Get unique dates
  const dates = [...new Set(
    dreams.map((d) => format(parseISO(d.createdAt), 'yyyy-MM-dd')),
  )].sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 1;

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  // Check if streak is "current" (last entry was today or yesterday)
  const lastDate = dates[dates.length - 1];
  const streakIsCurrent = lastDate === today || lastDate === yesterday;

  for (let i = dates.length - 1; i > 0; i--) {
    const curr = parseISO(dates[i]);
    const prev = parseISO(dates[i - 1]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      streak++;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, streak);
  currentStreak = streakIsCurrent ? streak : 0;

  return { currentStreak, longestStreak };
}

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

export function getDreamsForDate(dreams: Dream[], date: Date): Dream[] {
  const start = startOfDay(date);
  const end = endOfDay(date);
  return dreams.filter((d) => {
    const created = parseISO(d.createdAt);
    return isWithinInterval(created, { start, end });
  });
}

export function getDreamsByMonth(dreams: Dream[], year: number, month: number): Dream[] {
  return dreams.filter((d) => {
    const created = parseISO(d.createdAt);
    return created.getFullYear() === year && created.getMonth() === month;
  });
}

export function groupDreamsByMonth(dreams: Dream[]): Record<string, Dream[]> {
  const groups: Record<string, Dream[]> = {};
  for (const dream of dreams) {
    const key = format(parseISO(dream.createdAt), 'yyyy-MM');
    if (!groups[key]) groups[key] = [];
    groups[key].push(dream);
  }
  // Sort each group by date descending
  Object.values(groups).forEach((group) => group.sort(
    (a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime(),
  ));
  return groups;
}

// ---------------------------------------------------------------------------
// Search & Filter
// ---------------------------------------------------------------------------

export function searchDreams(
  dreams: Dream[],
  query: string,
): Dream[] {
  const q = query.toLowerCase().trim();
  if (!q) return dreams;

  return dreams.filter((d) =>
    d.title.toLowerCase().includes(q) ||
    d.content.toLowerCase().includes(q) ||
    d.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function filterDreams(
  dreams: Dream[],
  filters: {
    emotions?: Emotion[];
    isLucid?: boolean;
    isNightmare?: boolean;
    dateFrom?: string;
    dateTo?: string;
    tags?: string[];
  },
): Dream[] {
  return dreams.filter((d) => {
    if (filters.emotions?.length && !filters.emotions.some((e) => d.emotions.includes(e))) {
      return false;
    }
    if (filters.isLucid !== undefined && d.isLucid !== filters.isLucid) return false;
    if (filters.isNightmare !== undefined && d.isNightmare !== filters.isNightmare) return false;
    if (filters.dateFrom && d.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && d.createdAt > filters.dateTo) return false;
    if (filters.tags?.length && !filters.tags.some((t) => d.tags.includes(t))) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// All Tags
// ---------------------------------------------------------------------------

export function getAllTags(dreams: Dream[]): string[] {
  const tagSet = new Set<string>();
  for (const dream of dreams) {
    dream.tags.forEach((t) => tagSet.add(t));
  }
  return Array.from(tagSet).sort();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTitle(content: string): string {
  const words = content.trim().split(/\s+/);
  return words.slice(0, DREAM_ENTRY_CONFIG.autoTitleWordCount).join(' ') + (words.length > DREAM_ENTRY_CONFIG.autoTitleWordCount ? '…' : '');
}

function normalizeTags(tags: string[]): string[] {
  return tags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .filter((t, i, arr) => arr.indexOf(t) === i) // dedupe
    .slice(0, DREAM_ENTRY_CONFIG.maxTags);
}

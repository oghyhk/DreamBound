// ============================================================
// DreamBound — Core Type Definitions
// ============================================================

// --- Enums & Constants ---

export type Emotion =
  | 'joy'
  | 'sadness'
  | 'fear'
  | 'anger'
  | 'surprise'
  | 'confusion'
  | 'calm'
  | 'anxiety';

export const EMOTION_CONFIG: Record<
  Emotion,
  { label: string; color: string; icon: string }
> = {
  joy: { label: 'Joy', color: '#FBBF24', icon: 'Sun' },
  sadness: { label: 'Sadness', color: '#60A5FA', icon: 'CloudRain' },
  fear: { label: 'Fear', color: '#FB7185', icon: 'Zap' },
  anger: { label: 'Anger', color: '#F87171', icon: 'Flame' },
  surprise: { label: 'Surprise', color: '#C084FC', icon: 'Sparkles' },
  confusion: { label: 'Confusion', color: '#94A3B8', icon: 'Wind' },
  calm: { label: 'Calm', color: '#34D399', icon: 'Moon' },
  anxiety: { label: 'Anxiety', color: '#FB923C', icon: 'AlertTriangle' },
};

export const EMOTION_LIST: Emotion[] = Object.keys(EMOTION_CONFIG) as Emotion[];

// --- Core Data Models ---

export interface DreamSymbol {
  name: string;
  meaning: string;
  personalContext: string;
  occurrences: number;
}

export interface Interpretation {
  generatedAt: string;
  model: string;
  summary: string;
  themes: string[];
  symbols: DreamSymbol[];
  emotionalAnalysis: string;
  lucidityAnalysis: string;
  advice: string;
}

export interface DreamEdit {
  editedAt: string;
  content: string;
}

export interface Dream {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  content: string;
  audioUri?: string;
  audioDuration?: number;
  emotions: Emotion[];
  tags: string[];
  isLucid: boolean;
  isNightmare: boolean;
  interpretation?: Interpretation;
  editHistory: DreamEdit[];
}

export interface SleepEntry {
  id: string;
  date: string;
  bedtime?: string;
  wakeTime: string;
  quality: number;
  dreamRecall: number;
  notes?: string;
}

export type AiModel = 'gpt-4o' | 'gpt-4o-mini' | 'claude';

export interface UserPreferences {
  notificationsEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  lucidRemindersInterval: number;
  defaultEmotions: Emotion[];
  language: string;
  useMockAI: boolean;
  aiModel: AiModel;
  dreamWallEnabled: boolean;
}

export interface LifetimeStats {
  totalDreams: number;
  totalInterpretations: number;
  lucidDreams: number;
  nightmares: number;
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
}

export interface Profile {
  id: string;
  email: string;
  createdAt: string;
  premium: boolean;
  interpretationCredits: number;
  preferences: UserPreferences;
  lifetimeStats: LifetimeStats;
}

// --- Input Types ---

export interface CreateDreamInput {
  title?: string;
  content: string;
  audioUri?: string;
  audioDuration?: number;
  emotions?: Emotion[];
  tags?: string[];
  isLucid?: boolean;
  isNightmare?: boolean;
}

export interface UpdateDreamInput {
  title?: string;
  content?: string;
  emotions?: Emotion[];
  tags?: string[];
  isLucid?: boolean;
  isNightmare?: boolean;
}

// --- Insight / Analytics Types ---

export interface SymbolFrequency {
  symbol: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  recentDreams: string[];
}

export interface EmotionTrend {
  emotion: Emotion;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DreamStatistics {
  totalDreams: number;
  averagePerWeek: number;
  lucidPercentage: number;
  nightmarePercentage: number;
  mostActiveHour: number | null;
  mostCommonEmotion: Emotion | null;
  currentStreak: number;
  longestStreak: number;
  topSymbols: SymbolFrequency[];
  emotionDistribution: EmotionTrend[];
}

// --- UI State Types ---

export type JournalViewMode = 'list' | 'calendar';

export interface CalendarDay {
  date: string;
  dreams: Dream[];
  hasDreams: boolean;
  isLucid: boolean;
  isNightmare: boolean;
}

export interface FilterOptions {
  emotions?: Emotion[];
  isLucid?: boolean;
  isNightmare?: boolean;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  searchQuery?: string;
}

// --- Navigation Types ---

export type RootStackParamList = {
  '(tabs)': undefined;
  '(modals)/new-dream': { audioUri?: string; transcribedText?: string };
  '(modals)/dream/[id]': { dreamId: string };
  '(modals)/interpretation': { dreamId: string };
  '(modals)/settings': undefined;
};

export type TabParamList = {
  tonight: undefined;
  journal: undefined;
  insights: undefined;
  profile: undefined;
};

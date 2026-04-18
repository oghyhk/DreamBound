// ============================================================
// DreamBound — User Store (Zustand)
// Manages user profile, preferences, and app settings
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type {
  Profile,
  UserPreferences,
  LifetimeStats,
  SleepEntry,
} from '../types';
import { DEFAULT_PREFERENCES } from '../constants/config';

// ---------------------------------------------------------------------------
// State Interface
// ---------------------------------------------------------------------------

interface UserState {
  profile: Profile | null;
  isAuthenticated: boolean;
  isPremium: boolean;
  preferences: UserPreferences;
  sleepEntries: SleepEntry[];
  interpretationCreditsUsed: number;

  // Actions
  initProfile: (email: string) => void;
  logout: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setPremium: (premium: boolean) => void;

  // Sleep entries
  addSleepEntry: (entry: Omit<SleepEntry, 'id'>) => void;
  updateSleepEntry: (id: string, data: Partial<SleepEntry>) => void;
  deleteSleepEntry: (id: string) => void;

  // Interpretation credits
  useInterpretationCredit: () => boolean;
  resetMonthlyCredits: () => void;

  // Stats
  incrementStat: (key: keyof LifetimeStats) => void;
  updateStreak: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDefaultProfile(email: string): Profile {
  return {
    id: uuidv4(),
    email,
    createdAt: new Date().toISOString(),
    premium: false,
    interpretationCredits: 3,
    preferences: DEFAULT_PREFERENCES,
    lifetimeStats: {
      totalDreams: 0,
      totalInterpretations: 0,
      lucidDreams: 0,
      nightmares: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null,
    },
  };
}

function updateStreakStats(stats: LifetimeStats, newEntryDate: string): LifetimeStats {
  const lastDate = stats.lastEntryDate;
  const today = newEntryDate.split('T')[0];

  if (!lastDate) {
    return {
      ...stats,
      currentStreak: 1,
      longestStreak: Math.max(1, stats.longestStreak),
      lastEntryDate: today,
    };
  }

  const last = new Date(lastDate);
  const current = new Date(today);
  const diffMs = current.getTime() - last.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return stats;
  } else if (diffDays === 1) {
    const newStreak = stats.currentStreak + 1;
    return {
      ...stats,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, stats.longestStreak),
      lastEntryDate: today,
    };
  } else {
    return {
      ...stats,
      currentStreak: 1,
      lastEntryDate: today,
    };
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isAuthenticated: false,
      isPremium: false,
      preferences: DEFAULT_PREFERENCES,
      sleepEntries: [],
      interpretationCreditsUsed: 0,

      initProfile: (email) => {
        const profile = createDefaultProfile(email);
        set({
          profile,
          isAuthenticated: true,
          isPremium: false,
          preferences: profile.preferences,
        });
      },

      logout: () => {
        set({
          profile: null,
          isAuthenticated: false,
          isPremium: false,
          interpretationCreditsUsed: 0,
        });
      },

      updatePreferences: (prefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
          ...(state.profile && {
            profile: {
              ...state.profile,
              preferences: { ...state.profile.preferences, ...prefs },
            },
          }),
        }));
      },

      setPremium: (premium) => {
        set((state) => ({
          isPremium: premium,
          ...(state.profile && { profile: { ...state.profile, premium } }),
        }));
      },

      addSleepEntry: (entry) => {
        const id = uuidv4();
        set((state) => ({
          sleepEntries: [{ ...entry, id }, ...state.sleepEntries],
        }));
      },

      updateSleepEntry: (id, data) => {
        set((state) => ({
          sleepEntries: state.sleepEntries.map((e) =>
            e.id === id ? { ...e, ...data } : e,
          ),
        }));
      },

      deleteSleepEntry: (id) => {
        set((state) => ({
          sleepEntries: state.sleepEntries.filter((e) => e.id !== id),
        }));
      },

      useInterpretationCredit: () => {
        const { isPremium, interpretationCreditsUsed } = get();

        if (isPremium) return true;
        if (interpretationCreditsUsed >= 3) return false;

        set({ interpretationCreditsUsed: interpretationCreditsUsed + 1 });
        return true;
      },

      resetMonthlyCredits: () => {
        set({ interpretationCreditsUsed: 0 });
      },

      incrementStat: (key) => {
        set((state) => {
          if (!state.profile) return state;
          const stats = { ...state.profile.lifetimeStats };
          if (key in stats) {
            (stats as Record<string, number>)[key]++;
          }
          return {
            profile: { ...state.profile, lifetimeStats: stats },
          };
        });
      },

      updateStreak: () => {
        set((state) => {
          if (!state.profile) return state;
          const updatedStats = updateStreakStats(
            state.profile.lifetimeStats,
            new Date().toISOString(),
          );
          return {
            profile: {
              ...state.profile,
              lifetimeStats: updatedStats,
            },
          };
        });
      },
    }),
    {
      name: 'dreambound:user',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        isPremium: state.isPremium,
        preferences: state.preferences,
        sleepEntries: state.sleepEntries,
        interpretationCreditsUsed: state.interpretationCreditsUsed,
      }),
    },
  ),
);

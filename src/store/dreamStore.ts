// ============================================================
// DreamBound — Dream Store (Zustand)
// Manages dream state, CRUD operations, and sync
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Dream,
  CreateDreamInput,
  UpdateDreamInput,
  Interpretation,
  FilterOptions,
  JournalViewMode,
  Emotion,
} from '../types';
import {
  createDream,
  updateDream,
  attachAudio,
  removeAudio,
  runInterpretation,
  getDreamsForDate,
  groupDreamsByMonth,
  searchDreams,
  filterDreams,
  getStatistics,
  getAllTags,
} from '../services/dreamEngine';
import type { DreamStatistics } from '../types';

// ---------------------------------------------------------------------------
// State Interface
// ---------------------------------------------------------------------------

interface DreamState {
  // Data
  dreams: Dream[];
  isLoaded: boolean;

  // UI State
  viewMode: JournalViewMode;
  selectedDate: Date | null;
  filterOptions: FilterOptions;

  // Loading flags
  isSaving: boolean;
  isInterpreting: boolean;

  // Computed (cached)
  statistics: DreamStatistics | null;
  allTags: string[];

  // Actions — CRUD
  addDream: (input: CreateDreamInput) => Dream;
  editDream: (id: string, input: UpdateDreamInput) => void;
  deleteDream: (id: string) => void;
  addAudioToDream: (id: string, audioUri: string, duration: number) => Promise<void>;
  removeAudioFromDream: (id: string) => Promise<void>;

  // Actions — AI
  interpretDream: (id: string, useMock: boolean, aiModel: 'gpt-4o' | 'gpt-4o-mini' | 'claude', apiKey?: string) => Promise<void>;

  // Actions — UI
  setViewMode: (mode: JournalViewMode) => void;
  setSelectedDate: (date: Date | null) => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  clearFilters: () => void;

  // Actions — Data
  loadDreams: () => Promise<void>;
  rebuildStatistics: () => void;

  // Getters (computed selectors)
  getDream: (id: string) => Dream | undefined;
  getDreamsForDate: (date: Date) => Dream[];
  getRecentDreams: (count?: number) => Dream[];
  getFilteredDreams: () => Dream[];
  getGroupedDreams: () => Record<string, Dream[]>;
  getTodaysDream: () => Dream | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDreamStore = create<DreamState>()(
  persist(
    (set, get) => ({
      dreams: [],
      isLoaded: false,
      viewMode: 'list',
      selectedDate: null,
      filterOptions: {},
      isSaving: false,
      isInterpreting: false,
      statistics: null,
      allTags: [],

      // ---- CRUD ----

      addDream: (input) => {
        const dream = createDream(input);
        set((state) => ({
          dreams: [dream, ...state.dreams],
        }));
        get().rebuildStatistics();
        return dream;
      },

      editDream: (id, input) => {
        set((state) => ({
          dreams: state.dreams.map((d) =>
            d.id === id ? updateDream(d, input) : d,
          ),
        }));
        get().rebuildStatistics();
      },

      deleteDream: (id) => {
        set((state) => ({
          dreams: state.dreams.filter((d) => d.id !== id),
        }));
        get().rebuildStatistics();
      },

      addAudioToDream: async (id, audioUri, duration) => {
        set((state) => ({
          dreams: state.dreams.map((d) =>
            d.id === id ? { ...d, audioUri, audioDuration: duration } : d,
          ),
        }));
      },

      removeAudioFromDream: async (id) => {
        set((state) => ({
          dreams: state.dreams.map((d) =>
            d.id === id
              ? (() => {
                  const { audioUri: _, audioDuration: __, ...rest } = d;
                  return rest as Dream;
                })()
              : d,
          ),
        }));
      },

      // ---- AI ----

      interpretDream: async (id, useMock, aiModel, apiKey) => {
        const dream = get().dreams.find((d) => d.id === id);
        if (!dream) return;

        set({ isInterpreting: true });

        try {
          const interpretation = await runInterpretation(dream, useMock, aiModel, apiKey);

          set((state) => ({
            dreams: state.dreams.map((d) =>
              d.id === id ? { ...d, interpretation } : d,
            ),
            isInterpreting: false,
          }));
        } catch (err) {
          console.error('[DreamStore] Interpretation failed:', err);
          set({ isInterpreting: false });
        }
      },

      // ---- UI ----

      setViewMode: (mode) => set({ viewMode: mode }),

      setSelectedDate: (date) => set({ selectedDate: date }),

      setFilterOptions: (options) =>
        set((state) => ({
          filterOptions: { ...state.filterOptions, ...options },
        })),

      clearFilters: () => set({ filterOptions: {} }),

      // ---- Data ----

      loadDreams: async () => {
        // persist middleware handles loading automatically
        set({ isLoaded: true });
        get().rebuildStatistics();
      },

      rebuildStatistics: () => {
        const dreams = get().dreams;
        const stats = getStatistics(dreams);
        const tags = getAllTags(dreams);
        set({ statistics: stats, allTags: tags });
      },

      // ---- Getters ----

      getDream: (id) => get().dreams.find((d) => d.id === id),

      getDreamsForDate: (date) => getDreamsForDate(get().dreams, date),

      getRecentDreams: (count = 5) =>
        [...get().dreams]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, count),

      getFilteredDreams: () => {
        const { dreams, filterOptions } = get();
        let result = dreams;

        if (filterOptions.searchQuery) {
          result = searchDreams(result, filterOptions.searchQuery);
        }
        if (Object.keys(filterOptions).some(
          (k) => k !== 'searchQuery' && filterOptions[k as keyof FilterOptions] !== undefined,
        )) {
          const { searchQuery: _sq, ...rest } = filterOptions;
          result = filterDreams(result, rest);
        }

        return result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      },

      getGroupedDreams: () => {
        const filtered = get().getFilteredDreams();
        return groupDreamsByMonth(filtered);
      },

      getTodaysDream: () => {
        const today = new Date();
        const todayDreams = getDreamsForDate(get().dreams, today);
        return todayDreams[0] ?? null;
      },
    }),
    {
      name: 'dreambound:dreams',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dreams: state.dreams,
        viewMode: state.viewMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoaded = true;
          state.rebuildStatistics();
        }
      },
    },
  ),
);

// ============================================================
// DreamBound — Storage Service
// Wraps AsyncStorage with typed get/set operations
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { STORAGE_KEYS } from '../constants/config';
import type { Dream, SleepEntry, Profile, UserPreferences } from '../types';
import { DEFAULT_PREFERENCES } from '../constants/config';

// ---------------------------------------------------------------------------
// Dreams
// ---------------------------------------------------------------------------

export async function saveDreams(dreams: Dream[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.DREAMS, JSON.stringify(dreams));
}

export async function loadDreams(): Promise<Dream[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.DREAMS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Dream[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sleep Entries
// ---------------------------------------------------------------------------

export async function saveSleepEntries(entries: SleepEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SLEEP_ENTRIES, JSON.stringify(entries));
}

export async function loadSleepEntries(): Promise<SleepEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_ENTRIES);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SleepEntry[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Profile & Preferences
// ---------------------------------------------------------------------------

export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export async function loadProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
}

export async function loadPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

// ---------------------------------------------------------------------------
// Audio Files
// ---------------------------------------------------------------------------

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;

export async function ensureAudioDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
}

export function getAudioPath(filename: string): string {
  return `${AUDIO_DIR}${filename}`;
}

export async function saveAudioFile(uri: string, filename: string): Promise<string> {
  await ensureAudioDir();
  const dest = getAudioPath(filename);
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function deleteAudioFile(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Ignore deletion errors
  }
}

export async function getAudioFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (info.exists && 'size' in info) {
      return info.size ?? 0;
    }
  } catch {
    // ignore
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Data Export
// ---------------------------------------------------------------------------

export async function exportAllData(): Promise<string> {
  const [dreams, sleepEntries, profile, preferences] = await Promise.all([
    loadDreams(),
    loadSleepEntries(),
    loadProfile(),
    loadPreferences(),
  ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dreams,
      sleepEntries,
      profile,
      preferences,
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------------------
// Clear All Data
// ---------------------------------------------------------------------------

export async function clearAllData(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  await AsyncStorage.multiRemove(keys);
  // Also clear audio directory
  try {
    const info = await FileSystem.getInfoAsync(AUDIO_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(AUDIO_DIR, { idempotent: true });
    }
  } catch {
    // ignore
  }
}

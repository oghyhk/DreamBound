// ============================================================
// DreamBound — Audio Service
// Voice recording and playback using expo-av
// ============================================================

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AUDIO_CONFIG } from '../constants/config';
import { getAudioPath } from './storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecordingState {
  uri: string | null;
  duration: number;
  isRecording: boolean;
}

export interface AudioLevel {
  meters: number[];
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

let recordingInstance: Audio.Recording | null = null;
let recordingStartTime = 0;

export async function startRecording(): Promise<void> {
  // Request permissions
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Microphone permission not granted');
  }

  // Configure audio mode
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  // Create recording
  const { recording } = await Audio.Recording.createAsync(
    {
      isMeteringEnabled: true,
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: AUDIO_CONFIG.sampleRate,
        numberOfChannels: AUDIO_CONFIG.numberOfChannels,
        bitRate: AUDIO_CONFIG.bitRate,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: AUDIO_CONFIG.sampleRate,
        numberOfChannels: AUDIO_CONFIG.numberOfChannels,
        bitRate: AUDIO_CONFIG.bitRate,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    },
    // Update every 100ms
    undefined,
  );

  recordingInstance = recording;
  recordingStartTime = Date.now();
}

export async function stopRecording(): Promise<{ uri: string; duration: number }> {
  if (!recordingInstance) {
    throw new Error('No active recording');
  }

  const status = await recordingInstance.stopAndUnloadAsync();
  const uri = recordingInstance.getURI();

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
  });

  if (!uri) {
    throw new Error('No recording URI');
  }

  const duration = Math.round((Date.now() - recordingStartTime) / 1000);

  recordingInstance = null;
  recordingStartTime = 0;

  return {
    uri,
    duration: Math.min(duration, AUDIO_CONFIG.maxRecordingDurationSeconds),
  };
}

export async function cancelRecording(): Promise<void> {
  if (!recordingInstance) return;

  try {
    await recordingInstance.stopAndUnloadAsync();
    const uri = recordingInstance.getURI();
    if (uri) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Ignore errors during cancel
  } finally {
    recordingInstance = null;
    recordingStartTime = 0;
  }
}

export async function getRecordingStatus(): Promise<{
  duration: number;
  isRecording: boolean;
  meters?: number;
}> {
  if (!recordingInstance) {
    return { duration: 0, isRecording: false };
  }

  const status = await recordingInstance.getStatusAsync();
  const duration = Math.round((Date.now() - recordingStartTime) / 1000);

  return {
    duration: Math.min(duration, AUDIO_CONFIG.maxRecordingDurationSeconds),
    isRecording: true,
    meters: status.isRecording ? status.metering : undefined,
  };
}

export function isCurrentlyRecording(): boolean {
  return recordingInstance !== null;
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

let playbackInstance: Audio.Sound | null = null;

export async function playAudio(uri: string): Promise<void> {
  // Stop any current playback
  await stopPlayback();

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true },
  );

  playbackInstance = sound;
}

export async function stopPlayback(): Promise<void> {
  if (!playbackInstance) return;

  try {
    await playbackInstance.stopAsync();
    await playbackInstance.unloadAsync();
  } catch {
    // Ignore
  } finally {
    playbackInstance = null;
  }
}

export async function pausePlayback(): Promise<void> {
  if (!playbackInstance) return;
  await playbackInstance.pauseAsync();
}

export async function resumePlayback(): Promise<void> {
  if (!playbackInstance) return;
  await playbackInstance.playAsync();
}

export async function getPlaybackStatus(): Promise<{
  isPlaying: boolean;
  position: number;
  duration: number;
} | null> {
  if (!playbackInstance) return null;

  const status = await playbackInstance.getStatusAsync();
  if (!status.isLoaded) return null;

  return {
    isPlaying: status.isPlaying,
    position: status.positionMillis / 1000,
    duration: (status.durationMillis ?? 0) / 1000,
  };
}

// ---------------------------------------------------------------------------
// File Helpers
// ---------------------------------------------------------------------------

export async function deleteRecording(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignore
  }
}

export function generateAudioFilename(): string {
  const timestamp = Date.now();
  return `dream_${timestamp}.${AUDIO_CONFIG.audioFileExtension}`;
}

// ---------------------------------------------------------------------------
// Transcription Placeholder
// ---------------------------------------------------------------------------

export async function transcribeAudio(
  _uri: string,
): Promise<{ text: string; confidence: number }> {
  // PLACEHOLDER: Real implementation would use OpenAI Whisper API
  // or a similar speech-to-text service.
  //
  // For now, returns a placeholder that prompts the user to
  // manually type their dream if transcription fails.
  return {
    text: '',
    confidence: 0,
  };
}

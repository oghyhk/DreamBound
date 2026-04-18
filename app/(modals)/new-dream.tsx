// ============================================================
// DreamBound — New Dream Entry Modal
// Voice + text dream recording and capture
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useDreamStore } from '../../src/store/dreamStore';
import { useUserStore } from '../../src/store/userStore';
import { startRecording, stopRecording, getRecordingStatus, cancelRecording } from '../../src/services/audio';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import { formatDuration } from '../../src/utils/helpers';
import { EMOTION_CONFIG, type Emotion, EMOTION_LIST } from '../../src/types';

export default function NewDreamScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [tags, setTags] = useState('');
  const [isLucid, setIsLucid] = useState(false);
  const [isNightmare, setIsNightmare] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmotions, setShowEmotions] = useState(false);

  const addDream = useDreamStore((s) => s.addDream);
  const interpretDream = useDreamStore((s) => s.interpretDream);
  const useCredit = useUserStore((s) => s.useInterpretationCredit);
  const preferences = useUserStore((s) => s.preferences);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      Alert.alert('Recording Failed', 'Could not start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await stopRecording();
      setIsRecording(false);
      setAudioUri(result.uri);
      setAudioDuration(result.duration);
      // In a real app, we'd auto-transcribe here
      // For now, user types the content
    } catch (err) {
      setIsRecording(false);
      Alert.alert('Recording Failed', 'Could not save recording.');
    }
  };

  const handleCancelRecording = async () => {
    await cancelRecording();
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const handleToggleEmotion = (emotion: Emotion) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : prev.length < 3
        ? [...prev, emotion]
        : prev,
    );
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Dream', 'Please describe your dream before saving.');
      return;
    }

    setIsSaving(true);

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const dream = addDream({
      content: content.trim(),
      audioUri: audioUri ?? undefined,
      audioDuration: audioDuration || undefined,
      emotions: selectedEmotions,
      tags: tagList,
      isLucid,
      isNightmare,
    });

    // Auto-interpret if user has credits
    const hasCredit = useCredit();
    if (hasCredit) {
      await interpretDream(
        dream.id,
        preferences.useMockAI,
        preferences.aiModel,
        undefined, // API key would come from secure storage in production
      );
    }

    setIsSaving(false);
    router.back();
  };

  const handleDiscard = () => {
    if (content.trim() || audioUri) {
      Alert.alert('Discard Dream?', 'Your dream entry will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (audioUri) cancelRecording();
            router.back();
          },
        },
      ]);
    } else {
      router.back();
    }
  };

  if (isRecording) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.recordingScreen}>
          <Pressable style={styles.cancelButton} onPress={handleCancelRecording}>
            <X color={colors.textMuted} size={24} />
          </Pressable>

          <View style={styles.recordingContent}>
            <View style={styles.waveform}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    {
                      height: Math.random() * 40 + 10,
                      backgroundColor:
                        i % 3 === 0 ? colors.primary : colors.primaryLight + '88',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
            <Text style={styles.recordingLabel}>Recording…</Text>
          </View>

          <Pressable style={styles.stopButton} onPress={handleStopRecording}>
            <Square color={colors.white} size={32} fill={colors.white} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleDiscard}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Dream</Text>
        <Pressable onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
            {isSaving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Voice Recording Section */}
        {!audioUri && (
          <Pressable
            style={({ pressed }) => [
              styles.recordButton,
              pressed && styles.recordButtonPressed,
            ]}
            onPress={handleStartRecording}
          >
            <View style={styles.micCircle}>
              <Mic color={colors.white} size={28} />
            </View>
            <Text style={styles.recordButtonText}>Tap to record your dream</Text>
            <Text style={styles.recordButtonSubtext}>
              Speak as soon as you wake up
            </Text>
          </Pressable>
        )}

        {/* Audio Preview */}
        {audioUri && (
          <View style={styles.audioPreview}>
            <View style={styles.audioInfo}>
              <View style={styles.audioIcon}>
                <Mic color={colors.primary} size={16} />
              </View>
              <View>
                <Text style={styles.audioLabel}>Voice Recording</Text>
                <Text style={styles.audioDuration}>
                  {formatDuration(audioDuration)}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.deleteAudioButton}
              onPress={() => {
                cancelRecording();
                setAudioUri(null);
              }}
            >
              <Trash2 color={colors.nightmare} size={16} />
            </Pressable>
          </View>
        )}

        {/* Dream Text */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>What did you dream about?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe your dream in as much detail as you can remember…"
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Emotions */}
        <View style={styles.inputSection}>
          <Pressable
            style={styles.emotionToggle}
            onPress={() => setShowEmotions(!showEmotions)}
          >
            <Text style={styles.inputLabel}>
              Emotions {selectedEmotions.length > 0 && `(${selectedEmotions.length}/3)`}
            </Text>
            {showEmotions ? (
              <ChevronUp color={colors.textMuted} size={18} />
            ) : (
              <ChevronDown color={colors.textMuted} size={18} />
            )}
          </Pressable>

          {showEmotions && (
            <View style={styles.emotionsGrid}>
              {EMOTION_LIST.map((emotion) => {
                const isSelected = selectedEmotions.includes(emotion);
                return (
                  <Pressable
                    key={emotion}
                    style={[
                      styles.emotionChip,
                      isSelected && {
                        backgroundColor: EMOTION_CONFIG[emotion].color + '22',
                        borderColor: EMOTION_CONFIG[emotion].color,
                      },
                    ]}
                    onPress={() => handleToggleEmotion(emotion)}
                  >
                    <Text
                      style={[
                        styles.emotionChipText,
                        isSelected && {
                          color: EMOTION_CONFIG[emotion].color,
                        },
                      ]}
                    >
                      {EMOTION_CONFIG[emotion].label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Tags (comma separated)</Text>
          <TextInput
            style={styles.tagInput}
            placeholder="flying, water, chase…"
            placeholderTextColor={colors.textMuted}
            value={tags}
            onChangeText={setTags}
          />
        </View>

        {/* Toggles */}
        <View style={styles.toggleSection}>
          <Pressable
            style={[styles.toggleRow, isLucid && styles.toggleRowActive]}
            onPress={() => setIsLucid(!isLucid)}
          >
            <Text style={styles.toggleLabel}>Lucid Dream</Text>
            <View style={[styles.toggleTrack, isLucid && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, isLucid && styles.toggleThumbActive]} />
            </View>
          </Pressable>

          <Pressable
            style={[styles.toggleRow, isNightmare && styles.toggleRowActive]}
            onPress={() => setIsNightmare(!isNightmare)}
          >
            <Text style={styles.toggleLabel}>Nightmare</Text>
            <View style={[styles.toggleTrack, isNightmare && styles.toggleTrackActiveNightmare]}>
              <View style={[styles.toggleThumb, isNightmare && styles.toggleThumbActive]} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  saveText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[16],
    gap: spacing[6],
  },
  recordButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[8],
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  recordButtonPressed: {
    opacity: 0.7,
  },
  micCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  recordButtonText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  recordButtonSubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  audioIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  audioDuration: {
    ...typography.caption,
    color: colors.textMuted,
  },
  deleteAudioButton: {
    padding: spacing[2],
  },
  inputSection: {
    gap: spacing[2],
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emotionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  emotionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emotionChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tagInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleRowActive: {
    backgroundColor: colors.surfaceElevated,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: colors.lucid + '44',
  },
  toggleTrackActiveNightmare: {
    backgroundColor: colors.nightmare + '44',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textMuted,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  // Recording screen
  recordingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[6],
  },
  cancelButton: {
    padding: spacing[2],
    alignSelf: 'flex-start',
  },
  recordingContent: {
    alignItems: 'center',
    gap: spacing[6],
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 80,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  recordingTime: {
    ...typography.h1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  recordingLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  stopButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.nightmare,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

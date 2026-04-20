// ============================================================
// DreamBound — New Dream Entry Modal
// 3-stage voice pipeline: Record → Transcribe → Refine → Review
// Plus direct text entry and Save Raw quick save
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useDreamStore } from '../../src/store/dreamStore';
import { useUserStore } from '../../src/store/userStore';
import {
  startRecording,
  stopRecording,
  getRecordingStatus,
  cancelRecording,
  transcribeAudio,
} from '../../src/services/audio';
import { refineTranscription } from '../../src/services/refineText';
import { colors, spacing, borderRadius, typography } from '../../src/constants/theme';
import { formatDuration } from '../../src/utils/helpers';
import { STT_CONFIG, REFINEMENT_CONFIG, API_KEYS } from '../../src/constants/config';
import {
  EMOTION_CONFIG,
  type Emotion,
  EMOTION_LIST,
  type VoicePipelineStage,
} from '../../src/types';

export default function NewDreamScreen() {
  const router = useRouter();

  // Voice pipeline state
  const [stage, setStage] = useState<VoicePipelineStage>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [rawTranscription, setRawTranscription] = useState('');
  const [refinedText, setRefinedText] = useState('');
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Text entry mode (when user skips voice)
  const [textMode, setTextMode] = useState(false);

  // Review state
  const [showRaw, setShowRaw] = useState(false);

  // Dream metadata
  const [content, setContent] = useState('');
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

  // ---------------------------------------------------------------------------
  // Recording timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (stage === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  // ---------------------------------------------------------------------------
  // Voice Pipeline: Stage 1 — Record
  // ---------------------------------------------------------------------------

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setStage('recording');
      setRecordingDuration(0);
      setPipelineError(null);
    } catch (err) {
      Alert.alert('Recording Failed', 'Could not start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await stopRecording();
      setAudioUri(result.uri);
      setAudioDuration(result.duration);
      // Proceed to transcription
      await runTranscription(result.uri);
    } catch (err) {
      setStage('error');
      setPipelineError('Could not save recording.');
      Alert.alert('Recording Failed', 'Could not save recording.');
    }
  };

  const handleCancelRecording = async () => {
    await cancelRecording();
    setStage('idle');
    setRecordingDuration(0);
  };

  // ---------------------------------------------------------------------------
  // Voice Pipeline: Stage 2 — Transcribe
  // ---------------------------------------------------------------------------

  const runTranscription = async (uri: string) => {
    setStage('transcribing');
    setPipelineError(null);

    const sttProvider = STT_CONFIG.providers[STT_CONFIG.defaultProvider];

    const result = await transcribeAudio(uri, {
      apiKey: API_KEYS.groq,
      apiBaseUrl: sttProvider.baseUrl,
      model: sttProvider.model,
    });

    if (!result.success || !result.text) {
      // Transcription failed — go to review with empty text (user can type)
      setRawTranscription('');
      setRefinedText('');
      setStage('reviewing');
      setPipelineError(result.error ?? 'Transcription failed. Please type your dream.');
      return;
    }

    setRawTranscription(result.text);
    // Proceed to refinement
    await runRefinement(result.text);
  };

  // ---------------------------------------------------------------------------
  // Voice Pipeline: Stage 3 — Refine
  // ---------------------------------------------------------------------------

  const runRefinement = async (rawText: string) => {
    setStage('refining');

    const refineProvider = REFINEMENT_CONFIG.providers[REFINEMENT_CONFIG.defaultProvider];

    const result = await refineTranscription(rawText, {
      apiKey: API_KEYS.openrouter,
      apiBaseUrl: refineProvider.baseUrl,
      model: refineProvider.model,
    });

    setRefinedText(result.cleanedText);
    setContent(result.cleanedText);
    setStage('reviewing');

    if (!result.success) {
      setPipelineError(result.error ?? 'Refinement failed. Showing raw transcription.');
    }
  };

  // ---------------------------------------------------------------------------
  // Save Raw — skip refinement, save raw transcription immediately
  // ---------------------------------------------------------------------------

  const handleSaveRaw = async () => {
    const textToSave = rawTranscription || content;
    if (!textToSave.trim()) {
      Alert.alert('Empty Dream', 'No transcription to save.');
      return;
    }

    setIsSaving(true);

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const dream = addDream({
      content: textToSave.trim(),
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
        undefined,
      );
    }

    setIsSaving(false);
    router.back();
  };

  // ---------------------------------------------------------------------------
  // Save (after review/edit)
  // ---------------------------------------------------------------------------

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
        undefined,
      );
    }

    setIsSaving(false);
    router.back();
  };

  // ---------------------------------------------------------------------------
  // Discard
  // ---------------------------------------------------------------------------

  const handleDiscard = () => {
    if (content.trim() || audioUri) {
      Alert.alert('Discard Dream?', 'Your dream entry will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            if (stage === 'recording') await cancelRecording();
            if (audioUri) {
              try {
                const { deleteRecording } = await import('../../src/services/audio');
                await deleteRecording(audioUri);
              } catch {}
            }
            router.back();
          },
        },
      ]);
    } else {
      router.back();
    }
  };

  // ---------------------------------------------------------------------------
  // Emotion handling
  // ---------------------------------------------------------------------------

  const handleToggleEmotion = (emotion: Emotion) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : prev.length < 3
        ? [...prev, emotion]
        : prev,
    );
  };

  // ---------------------------------------------------------------------------
  // Switch to text-only mode
  // ---------------------------------------------------------------------------

  const handleTextMode = () => {
    setTextMode(true);
    setStage('reviewing');
  };

  // ---------------------------------------------------------------------------
  // Header (shared across all stages)
  // ---------------------------------------------------------------------------

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={handleDiscard}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
      <Text style={styles.headerTitle}>New Dream</Text>
      <View style={styles.headerRight}>
        {/* Save Raw — available during reviewing stage when we have transcription */}
        {stage === 'reviewing' && rawTranscription ? (
          <Pressable onPress={handleSaveRaw} disabled={isSaving} style={styles.saveRawButton}>
            <Save color={colors.accent} size={16} />
            <Text style={styles.saveRawText}>Save Raw</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={handleSave} disabled={isSaving || stage !== 'reviewing'}>
          <Text style={[styles.saveText, (isSaving || stage !== 'reviewing') && styles.saveTextDisabled]}>
            {isSaving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render: Recording screen (full-screen)
  // ---------------------------------------------------------------------------

  if (stage === 'recording') {
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

  // ---------------------------------------------------------------------------
  // Render: Transcribing / Refining (processing overlay)
  // ---------------------------------------------------------------------------

  const isProcessing = stage === 'transcribing' || stage === 'refining';

  // ---------------------------------------------------------------------------
  // Main content
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Processing indicator (transcribing or refining) */}
        {isProcessing && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingTitle}>
              {stage === 'transcribing' ? 'Transcribing…' : 'Cleaning up text…'}
            </Text>
            <Text style={styles.processingSubtext}>
              {stage === 'transcribing'
                ? 'Converting your voice to text'
                : 'Removing filler words'}
            </Text>
          </View>
        )}

        {/* Voice pipeline error banner */}
        {pipelineError && stage === 'reviewing' && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{pipelineError}</Text>
          </View>
        )}

        {/* Mic button — idle stage, no text mode */}
        {stage === 'idle' && !textMode && (
          <>
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

            {/* Or type instead */}
            <Pressable style={styles.textModeButton} onPress={handleTextMode}>
              <Text style={styles.textModeText}>Or type your dream instead</Text>
            </Pressable>
          </>
        )}

        {/* Audio preview (after recording) */}
        {audioUri && stage !== 'idle' && (
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
                setAudioUri(null);
                setAudioDuration(0);
                setRawTranscription('');
                setRefinedText('');
                setStage('idle');
              }}
            >
              <Trash2 color={colors.nightmare} size={16} />
            </Pressable>
          </View>
        )}

        {/* Review stage: show transcription text (raw or refined) */}
        {stage === 'reviewing' && (
          <>
            {/* Raw / Cleaned toggle (only if we have both) */}
            {rawTranscription && refinedText && rawTranscription !== refinedText && (
              <Pressable style={styles.toggleRawButton} onPress={() => setShowRaw(!showRaw)}>
                {showRaw ? (
                  <EyeOff color={colors.textMuted} size={16} />
                ) : (
                  <Eye color={colors.textMuted} size={16} />
                )}
                <Text style={styles.toggleRawText}>
                  {showRaw ? 'Showing raw transcription' : 'Showing cleaned text'}
                </Text>
              </Pressable>
            )}

            {/* Dream text input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {rawTranscription ? 'Your dream (edit as needed)' : 'What did you dream about?'}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe your dream in as much detail as you can remember…"
                placeholderTextColor={colors.textMuted}
                value={showRaw ? rawTranscription : content}
                onChangeText={(text) => {
                  if (!showRaw) {
                    setContent(text);
                  }
                }}
                editable={!showRaw}
                multiline
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        {/* Text-only mode: idle but user chose to type */}
        {stage === 'reviewing' && textMode && !rawTranscription && (
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
        )}

        {/* Save Raw button (prominent, during reviewing with transcription) */}
        {stage === 'reviewing' && rawTranscription && (
          <Pressable
            style={({ pressed }) => [
              styles.saveRawProminentButton,
              pressed && styles.saveRawProminentButtonPressed,
            ]}
            onPress={handleSaveRaw}
            disabled={isSaving}
          >
            <Save color={colors.accent} size={18} />
            <Text style={styles.saveRawProminentText}>
              Save Raw — skip cleanup
            </Text>
          </Pressable>
        )}

        {/* Metadata section (visible in reviewing state) */}
        {stage === 'reviewing' && (
          <>
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  saveRawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent + '15',
  },
  saveRawText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
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
    gap: spacing[4],
  },

  // Processing states
  processingCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[8],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  processingTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  processingSubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },

  // Error banner
  errorBanner: {
    backgroundColor: colors.nightmare + '15',
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.nightmare + '30',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.nightmare,
  },

  // Recording button (idle state)
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

  // Text mode button
  textModeButton: {
    alignItems: 'center',
    padding: spacing[3],
  },
  textModeText: {
    ...typography.body,
    color: colors.textMuted,
  },

  // Audio preview
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

  // Raw / Cleaned toggle
  toggleRawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  toggleRawText: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // Input sections
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

  // Save Raw prominent button
  saveRawProminentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  saveRawProminentButtonPressed: {
    opacity: 0.7,
  },
  saveRawProminentText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },

  // Emotions
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

  // Tags
  tagInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Toggles
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

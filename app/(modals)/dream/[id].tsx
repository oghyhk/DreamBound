// ============================================================
// DreamBound — Dream Detail Modal
// Full view of a single dream with AI interpretation
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ArrowLeft,
  Trash2,
  Sparkles,
  Mic,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useDreamStore } from '../../../src/store/dreamStore';
import { useUserStore } from '../../../src/store/userStore';
import { colors, spacing, borderRadius, typography, shadows } from '../../../src/constants/theme';
import { formatDreamDate, formatDuration } from '../../../src/utils/helpers';
import { EMOTION_CONFIG } from '../../../src/types';

export default function DreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const dream = useDreamStore((s) => s.getDream(id ?? ''));
  const deleteDream = useDreamStore((s) => s.deleteDream);
  const interpretDream = useDreamStore((s) => s.interpretDream);
  const isInterpreting = useDreamStore((s) => s.isInterpreting);

  const preferences = useUserStore((s) => s.preferences);
  const useCredit = useUserStore((s) => s.useInterpretationCredit);

  if (!dream) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Dream not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleInterpret = async () => {
    if (dream.interpretation) return; // Already has one

    const hasCredit = useCredit();
    if (!hasCredit) {
      Alert.alert(
        'No Credits Left',
        'Upgrade to Premium for unlimited AI interpretations.',
      );
      return;
    }

    await interpretDream(
      dream.id,
      preferences.useMockAI,
      preferences.aiModel,
      undefined,
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete Dream?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDream(dream.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {dream.title}
        </Text>
        <Pressable onPress={handleDelete}>
          <Trash2 color={colors.nightmare} size={20} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dream Meta */}
        <View style={styles.metaRow}>
          <Text style={styles.date}>{formatDreamDate(dream.createdAt)}</Text>
          {dream.isLucid && (
            <View style={[styles.badge, styles.lucidBadge]}>
              <Text style={styles.lucidBadgeText}>Lucid</Text>
            </View>
          )}
          {dream.isNightmare && (
            <View style={[styles.badge, styles.nightmareBadge]}>
              <Text style={styles.nightmareBadgeText}>Nightmare</Text>
            </View>
          )}
        </View>

        {/* Audio */}
        {dream.audioUri && (
          <View style={styles.audioCard}>
            <View style={styles.audioLeft}>
              <Mic color={colors.primary} size={18} />
              <Text style={styles.audioLabel}>Voice Recording</Text>
            </View>
            <Text style={styles.audioDuration}>
              {formatDuration(dream.audioDuration ?? 0)}
            </Text>
          </View>
        )}

        {/* Emotions */}
        {dream.emotions.length > 0 && (
          <View style={styles.emotionsRow}>
            {dream.emotions.map((emotion) => (
              <View
                key={emotion}
                style={[
                  styles.emotionBadge,
                  { backgroundColor: EMOTION_CONFIG[emotion].color + '22' },
                ]}
              >
                <Text
                  style={[
                    styles.emotionBadgeText,
                    { color: EMOTION_CONFIG[emotion].color },
                  ]}
                >
                  {EMOTION_CONFIG[emotion].label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        {dream.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {dream.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Dream Content */}
        <View style={styles.contentCard}>
          <Text style={styles.dreamContent}>{dream.content}</Text>
        </View>

        {/* AI Interpretation */}
        {dream.interpretation ? (
          <View style={styles.interpretationCard}>
            <View style={styles.interpretationHeader}>
              <View style={styles.aiBadge}>
                <Sparkles color={colors.accent} size={14} />
                <Text style={styles.aiBadgeText}>AI Interpretation</Text>
              </View>
              <Text style={styles.interpretationModel}>
                {dream.interpretation.model}
              </Text>
            </View>

            <Text style={styles.interpretationSummary}>
              {dream.interpretation.summary}
            </Text>

            {dream.interpretation.themes.length > 0 && (
              <View style={styles.themesRow}>
                {dream.interpretation.themes.map((theme) => (
                  <View key={theme} style={styles.themeChip}>
                    <Text style={styles.themeChipText}>{theme}</Text>
                  </View>
                ))}
              </View>
            )}

            {dream.interpretation.symbols.length > 0 && (
              <View style={styles.symbolsSection}>
                <Text style={styles.symbolsSectionTitle}>Key Symbols</Text>
                {dream.interpretation.symbols.map((symbol, idx) => (
                  <View key={idx} style={styles.symbolItem}>
                    <Text style={styles.symbolName}>{symbol.name}</Text>
                    <Text style={styles.symbolMeaning}>{symbol.meaning}</Text>
                    <Text style={styles.symbolContext}>{symbol.personalContext}</Text>
                  </View>
                ))}
              </View>
            )}

            {dream.interpretation.emotionalAnalysis && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisTitle}>Emotional Analysis</Text>
                <Text style={styles.analysisText}>
                  {dream.interpretation.emotionalAnalysis}
                </Text>
              </View>
            )}

            {dream.interpretation.lucidityAnalysis && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisTitle}>Lucidity Analysis</Text>
                <Text style={styles.analysisText}>
                  {dream.interpretation.lucidityAnalysis}
                </Text>
              </View>
            )}

            {dream.interpretation.advice && (
              <View style={styles.adviceCard}>
                <Text style={styles.adviceTitle}>Reflection</Text>
                <Text style={styles.adviceText}>{dream.interpretation.advice}</Text>
              </View>
            )}
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.interpretButton,
              pressed && styles.interpretButtonPressed,
              isInterpreting && styles.interpretButtonDisabled,
            ]}
            onPress={handleInterpret}
            disabled={isInterpreting}
          >
            <Sparkles color={colors.white} size={20} />
            <Text style={styles.interpretButtonText}>
              {isInterpreting ? 'Analyzing…' : 'Get AI Interpretation'}
            </Text>
          </Pressable>
        )}

        {/* Edit History */}
        {dream.editHistory.length > 0 && (
          <View style={styles.editHistory}>
            <Text style={styles.editHistoryTitle}>
              {dream.editHistory.length} previous version
              {dream.editHistory.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
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
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing[4],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[16],
    gap: spacing[4],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  date: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  lucidBadge: {
    backgroundColor: colors.lucid + '22',
  },
  lucidBadgeText: {
    ...typography.caption,
    color: colors.lucid,
    fontWeight: '600',
  },
  nightmareBadge: {
    backgroundColor: colors.nightmare + '22',
  },
  nightmareBadgeText: {
    ...typography.caption,
    color: colors.nightmare,
    fontWeight: '600',
  },
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  audioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  audioLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  audioDuration: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emotionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  emotionBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  emotionBadgeText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tagChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  dreamContent: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  interpretationCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.accent + '44',
    gap: spacing[4],
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.accent + '22',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  aiBadgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  interpretationModel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  interpretationSummary: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  themeChip: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  themeChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  symbolsSection: {
    gap: spacing[3],
  },
  symbolsSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  symbolItem: {
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  symbolName: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  symbolMeaning: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  symbolContext: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  analysisSection: {
    gap: spacing[1],
  },
  analysisTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  analysisText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  adviceCard: {
    backgroundColor: colors.primary + '11',
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  adviceTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  adviceText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  interpretButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing[4],
  },
  interpretButtonPressed: {
    opacity: 0.8,
  },
  interpretButtonDisabled: {
    opacity: 0.5,
  },
  interpretButtonText: {
    ...typography.button,
    color: colors.white,
  },
  editHistory: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  editHistoryTitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

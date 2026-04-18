// ============================================================
// DreamBound — Insights Screen
// Dream patterns, statistics, recurring symbols
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Moon,
  Zap,
  Flame,
  BarChart2,
  Sparkles,
} from 'lucide-react-native';
import { useDreamStore } from '../../src/store/dreamStore';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import { formatHour } from '../../src/utils/helpers';
import { EMOTION_CONFIG, type Emotion } from '../../src/types';

export default function InsightsScreen() {
  const router = useRouter();
  const statistics = useDreamStore((s) => s.statistics);
  const dreams = useDreamStore((s) => s.dreams);

  if (!statistics || statistics.totalDreams === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
        </View>
        <View style={styles.emptyState}>
          <Moon color={colors.textMuted} size={48} />
          <Text style={styles.emptyTitle}>No insights yet</Text>
          <Text style={styles.emptySubtitle}>
            Start recording dreams to see patterns and statistics
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp color={colors.success} size={14} />;
    if (trend === 'down') return <TrendingDown color={colors.nightmare} size={14} />;
    return <Minus color={colors.textMuted} size={14} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
        </View>

        {/* Overview Stats */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{statistics.totalDreams}</Text>
            <Text style={styles.overviewLabel}>Total Dreams</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{statistics.averagePerWeek}</Text>
            <Text style={styles.overviewLabel}>Avg / Week</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{statistics.currentStreak}</Text>
            <Text style={styles.overviewLabel}>Current Streak</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{statistics.longestStreak}</Text>
            <Text style={styles.overviewLabel}>Longest Streak</Text>
          </View>
        </View>

        {/* Dream Type Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dream Types</Text>
          <View style={styles.typeRow}>
            <View style={[styles.typeCard, { borderLeftColor: colors.lucid }]}>
              <View style={styles.typeHeader}>
                <Zap color={colors.lucid} size={16} />
                <Text style={styles.typeLabel}>Lucid</Text>
              </View>
              <Text style={styles.typeValue}>{statistics.lucidPercentage}%</Text>
            </View>
            <View style={[styles.typeCard, { borderLeftColor: colors.nightmare }]}>
              <View style={styles.typeHeader}>
                <Flame color={colors.nightmare} size={16} />
                <Text style={styles.typeLabel}>Nightmare</Text>
              </View>
              <Text style={styles.typeValue}>{statistics.nightmarePercentage}%</Text>
            </View>
          </View>
        </View>

        {/* Emotion Distribution */}
        {statistics.emotionDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emotion Breakdown</Text>
            <View style={styles.emotionList}>
              {statistics.emotionDistribution
                .filter((e) => e.count > 0)
                .sort((a, b) => b.count - a.count)
                .map(({ emotion, count, percentage }) => (
                  <View key={emotion} style={styles.emotionRow}>
                    <View
                      style={[
                        styles.emotionDot,
                        { backgroundColor: EMOTION_CONFIG[emotion].color },
                      ]}
                    />
                    <Text style={styles.emotionName}>
                      {EMOTION_CONFIG[emotion].label}
                    </Text>
                    <View style={styles.emotionBarWrapper}>
                      <View
                        style={[
                          styles.emotionBar,
                          {
                            width: `${percentage}%`,
                            backgroundColor: EMOTION_CONFIG[emotion].color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.emotionCount}>{count}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Most Active Time */}
        {statistics.mostActiveHour !== null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Active Time</Text>
            <View style={styles.infoCard}>
              <Moon color={colors.primaryLight} size={20} />
              <Text style={styles.infoText}>
                You most often record dreams around{' '}
                <Text style={styles.infoHighlight}>
                  {formatHour(statistics.mostActiveHour)}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Recurring Symbols */}
        {statistics.topSymbols.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recurring Symbols</Text>
              <Text style={styles.sectionCount}>
                {statistics.topSymbols.length} detected
              </Text>
            </View>
            <View style={styles.symbolsList}>
              {statistics.topSymbols.slice(0, 8).map((item, idx) => (
                <Pressable
                  key={item.symbol}
                  style={({ pressed }) => [
                    styles.symbolCard,
                    pressed && styles.symbolCardPressed,
                  ]}
                >
                  <View style={styles.symbolHeader}>
                    <View style={styles.symbolRank}>
                      <Text style={styles.symbolRankText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.symbolName}>{item.symbol}</Text>
                    <View style={styles.symbolTrend}>
                      <TrendIcon trend={item.trend} />
                    </View>
                  </View>
                  <Text style={styles.symbolCount}>
                    {item.count} {item.count === 1 ? 'time' : 'times'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Most Common Emotion */}
        {statistics.mostCommonEmotion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dominant Emotion</Text>
            <View style={styles.infoCard}>
              <View
                style={[
                  styles.emotionDotLarge,
                  { backgroundColor: EMOTION_CONFIG[statistics.mostCommonEmotion].color },
                ]}
              />
              <Text style={styles.infoText}>
                Your most frequent emotion is{' '}
                <Text style={styles.infoHighlight}>
                  {EMOTION_CONFIG[statistics.mostCommonEmotion].label}
                </Text>
              </Text>
            </View>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[16],
  },
  header: {
    marginBottom: spacing[4],
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingVertical: spacing[16],
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  overviewCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewValue: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  overviewLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing[3],
  },
  sectionCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftColor: colors.primary,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  typeLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  typeValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  emotionList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  emotionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emotionName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 70,
  },
  emotionBarWrapper: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  emotionBar: {
    height: '100%',
    borderRadius: 3,
  },
  emotionCount: {
    ...typography.caption,
    color: colors.textMuted,
    width: 24,
    textAlign: 'right',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  infoHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  emotionDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  symbolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  symbolCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  symbolCardPressed: {
    opacity: 0.7,
  },
  symbolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  symbolRank: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolRankText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  symbolName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textTransform: 'capitalize',
  },
  symbolTrend: {
    marginLeft: 'auto',
  },
  symbolCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 28,
  },
});

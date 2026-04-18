// ============================================================
// DreamBound — Tonight Screen (Home Tab)
// Quick entry, tonight's summary, recent dreams
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, ChevronRight, Sparkles } from 'lucide-react-native';
import { useDreamStore } from '../../src/store/dreamStore';
import { useUserStore } from '../../src/store/userStore';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import { formatDreamDate, truncate } from '../../src/utils/helpers';
import { EMOTION_CONFIG } from '../../src/types';

export default function TonightScreen() {
  const router = useRouter();
  const recentDreams = useDreamStore((s) => s.getRecentDreams(5));
  const todaysDream = useDreamStore((s) => s.getTodaysDream());
  const statistics = useDreamStore((s) => s.statistics);
  const isPremium = useUserStore((s) => s.isPremium);

  const handleNewDream = () => router.push('/(modals)/new-dream');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good evening</Text>
          <Text style={styles.title}>DreamBound</Text>
        </View>

        {/* Quick Entry CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.quickEntryCard,
            pressed && styles.quickEntryCardPressed,
          ]}
          onPress={handleNewDream}
        >
          <View style={styles.quickEntryLeft}>
            <View style={styles.micBadge}>
              <Mic color={colors.white} size={24} />
            </View>
            <View style={styles.quickEntryText}>
              <Text style={styles.quickEntryTitle}>Record a Dream</Text>
              <Text style={styles.quickEntrySubtitle}>
                Speak or type what you remember
              </Text>
            </View>
          </View>
          <ChevronRight color={colors.textMuted} size={20} />
        </Pressable>

        {/* Stats Row */}
        {statistics && statistics.totalDreams > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.totalDreams}</Text>
              <Text style={styles.statLabel}>Dreams</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.lucidPercentage}%</Text>
              <Text style={styles.statLabel}>Lucid</Text>
            </View>
          </View>
        )}

        {/* Premium Banner */}
        {!isPremium && (
          <Pressable style={styles.premiumBanner}>
            <Sparkles color={colors.accent} size={16} />
            <Text style={styles.premiumText}>
              Unlock unlimited interpretations with Premium
            </Text>
          </Pressable>
        )}

        {/* Recent Dreams */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Dreams</Text>
            {recentDreams.length > 0 && (
              <Pressable onPress={() => router.push('/journal')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )}
          </View>

          {recentDreams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No dreams yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the mic button above to record your first dream
              </Text>
            </View>
          ) : (
            recentDreams.map((dream) => (
              <Pressable
                key={dream.id}
                style={({ pressed }) => [
                  styles.dreamCard,
                  pressed && styles.dreamCardPressed,
                  dream.isLucid && styles.dreamCardLucid,
                  dream.isNightmare && styles.dreamCardNightmare,
                ]}
                onPress={() => router.push(`/dream/${dream.id}`)}
              >
                <View style={styles.dreamCardHeader}>
                  <Text style={styles.dreamTitle} numberOfLines={1}>
                    {dream.title}
                  </Text>
                  <Text style={styles.dreamDate}>
                    {formatDreamDate(dream.createdAt)}
                  </Text>
                </View>
                {dream.emotions.length > 0 && (
                  <View style={styles.emotionRow}>
                    {dream.emotions.slice(0, 2).map((emotion) => (
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
                <Text style={styles.dreamSnippet} numberOfLines={2}>
                  {truncate(dream.content, 120)}
                </Text>
              </Pressable>
            ))
          )}
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[16],
  },
  header: {
    marginBottom: spacing[6],
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing[1],
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  quickEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickEntryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  quickEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  micBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickEntryText: {
    gap: 2,
  },
  quickEntryTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  quickEntrySubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  premiumText: {
    ...typography.bodySmall,
    color: colors.accent,
    flex: 1,
  },
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[8],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dreamCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...shadows.card,
  },
  dreamCardPressed: {
    opacity: 0.8,
  },
  dreamCardLucid: {
    borderLeftColor: colors.lucid,
  },
  dreamCardNightmare: {
    borderLeftColor: colors.nightmare,
  },
  dreamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  dreamTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing[2],
  },
  dreamDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emotionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  emotionBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  emotionBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  dreamSnippet: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

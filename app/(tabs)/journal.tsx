// ============================================================
// DreamBound — Journal Screen
// Calendar + List view of all dreams
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Calendar,
  List,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { useDreamStore } from '../../src/store/dreamStore';
import { colors, spacing, borderRadius, typography } from '../../src/constants/theme';
import { formatDreamDate, truncate } from '../../src/utils/helpers';
import { EMOTION_CONFIG, type Dream, type Emotion } from '../../src/types';

export default function JournalScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const allDreams = useDreamStore((s) => s.dreams);
  const getGroupedDreams = useDreamStore((s) => s.getGroupedDreams);

  // Filter by search
  const filteredDreams = searchQuery
    ? allDreams.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allDreams;

  const grouped = getGroupedDreams();

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0 = Sunday

  const dreamsByDate: Record<string, Dream[]> = {};
  for (const dream of filteredDreams) {
    const dateKey = format(parseISO(dream.createdAt), 'yyyy-MM-dd');
    if (!dreamsByDate[dateKey]) dreamsByDate[dateKey] = [];
    dreamsByDate[dateKey].push(dream);
  }

  const renderDreamCard = ({ item }: { item: Dream }) => (
    <Pressable
      style={({ pressed }) => [
        styles.dreamCard,
        pressed && styles.dreamCardPressed,
        item.isLucid && styles.dreamCardLucid,
        item.isNightmare && styles.dreamCardNightmare,
      ]}
      onPress={() => router.push(`/dream/${item.id}`)}
    >
      <View style={styles.dreamCardHeader}>
        <Text style={styles.dreamTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.dreamDate}>{formatDreamDate(item.createdAt)}</Text>
      </View>
      {item.emotions.length > 0 && (
        <View style={styles.emotionRow}>
          {item.emotions.slice(0, 2).map((emotion) => (
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
        {truncate(item.content, 120)}
      </Text>
    </Pressable>
  );

  const renderMonthGroup = () => {
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, dreams]) => (
        <View key={monthKey} style={styles.monthGroup}>
          <Text style={styles.monthHeader}>
            {format(parseISO(`${monthKey}-01`), 'MMMM yyyy')}
          </Text>
          {dreams.map((dream) => (
            <View key={dream.id}>{renderDreamCard({ item: dream })}</View>
          ))}
        </View>
      ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.iconButton, viewMode === 'list' && styles.iconButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List color={viewMode === 'list' ? colors.primary : colors.textMuted} size={20} />
          </Pressable>
          <Pressable
            style={[styles.iconButton, viewMode === 'calendar' && styles.iconButtonActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Calendar color={viewMode === 'calendar' ? colors.primary : colors.textMuted} size={20} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Search color={colors.textMuted} size={16} style={styles.searchIcon} />
          <Pressable
            style={styles.searchInput}
            onPress={() => {}}
          >
            <Text style={styles.searchPlaceholder}>Search dreams…</Text>
          </Pressable>
        </View>
      </View>

      {/* List View */}
      {viewMode === 'list' && (
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={renderMonthGroup as any}
          keyExtractor={() => 'content'}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No dreams found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search' : 'Start recording your dreams'}
              </Text>
            </View>
          }
        />
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <View style={styles.calendarContainer}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft color={colors.textSecondary} size={24} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {format(currentMonth, 'MMMM yyyy')}
            </Text>
            <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight color={colors.textSecondary} size={24} />
            </Pressable>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <Text key={d} style={styles.dayHeaderText}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Padding for first week */}
            {Array.from({ length: startPadding }).map((_, i) => (
              <View key={`pad-${i}`} style={styles.calendarDay} />
            ))}
            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayDreams = dreamsByDate[dateKey] ?? [];
              const hasLucid = dayDreams.some((d) => d.isLucid);
              const hasNightmare = dayDreams.some((d) => d.isNightmare);
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <Pressable
                  key={dateKey}
                  style={[styles.calendarDay, isToday && styles.calendarDayToday]}
                  onPress={() => {
                    if (dayDreams.length > 0) {
                      // Navigate to first dream
                      router.push(`/dream/${dayDreams[0].id}`);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.calendarDayNumber,
                      isToday && styles.calendarDayNumberToday,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                  {dayDreams.length > 0 && (
                    <View style={styles.dotsRow}>
                      {hasLucid && <View style={[styles.dot, { backgroundColor: colors.lucid }]} />}
                      {hasNightmare && <View style={[styles.dot, { backgroundColor: colors.nightmare }]} />}
                      {!hasLucid && !hasNightmare && (
                        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                      )}
                      {dayDreams.length > 1 && (
                        <Text style={styles.dotCount}>+{dayDreams.length - 1}</Text>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  searchRow: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[3],
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[16],
  },
  monthGroup: {
    marginBottom: spacing[4],
  },
  monthHeader: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
  dreamCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  calendarContainer: {
    paddingHorizontal: spacing[4],
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  monthTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[1],
  },
  calendarDayToday: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
  },
  calendarDayNumber: {
    ...typography.body,
    color: colors.textSecondary,
  },
  calendarDayNumberToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 8,
  },
});

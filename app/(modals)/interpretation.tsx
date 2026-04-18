// ============================================================
// DreamBound — Interpretation Modal (Placeholder)
// Full-screen AI interpretation view
// Route: /(modals)/interpretation?dreamId=xxx
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { useDreamStore } from '../../src/store/dreamStore';
import { colors, spacing, typography } from '../../src/constants/theme';

export default function InterpretationModal() {
  const { dreamId } = useLocalSearchParams<{ dreamId: string }>();
  const router = useRouter();
  const dream = useDreamStore((s) => s.getDream(dreamId ?? ''));

  if (!dream) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Interpretation</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Dream not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const interp = dream.interpretation;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Sparkles color={colors.accent} size={16} />
          <Text style={styles.headerTitleText}>AI Interpretation</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!interp ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No interpretation yet</Text>
            <Text style={styles.emptySubtitle}>
              Save this dream and tap "Interpret" to get an AI analysis.
            </Text>
          </View>
        ) : (
          <View style={styles.interpretationContent}>
            <Text style={styles.summary}>{interp.summary}</Text>
            {/* Full interpretation content would be rendered here */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitleText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: spacing[16] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[16], gap: spacing[2] },
  emptyTitle: { ...typography.h2, color: colors.textSecondary },
  emptySubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
  interpretationContent: { gap: spacing[4] },
  summary: { ...typography.body, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 26 },
});

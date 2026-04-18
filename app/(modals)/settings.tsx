// ============================================================
// DreamBound — Settings Modal (Placeholder)
// App settings sheet
// Route: /(modals)/settings
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useUserStore } from '../../src/store/userStore';
import { colors, spacing, borderRadius, typography } from '../../src/constants/theme';

export default function SettingsModal() {
  const router = useRouter();
  const preferences = useUserStore((s) => s.preferences);
  const updatePreferences = useUserStore((s) => s.updatePreferences);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Settings</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Use Mock AI</Text>
                <Text style={styles.settingDescription}>
                  Use simulated AI responses (no API key required)
                </Text>
              </View>
              <Switch
                value={preferences.useMockAI}
                onValueChange={(val) => updatePreferences({ useMockAI: val })}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.white}
              />
            </View>

            <Pressable style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>AI Model</Text>
                <Text style={styles.settingDescription}>
                  {preferences.aiModel}
                </Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </Pressable>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive dream reminders and lucid tips
                </Text>
              </View>
              <Switch
                value={preferences.notificationsEnabled}
                onValueChange={(val) => updatePreferences({ notificationsEnabled: val })}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.white}
              />
            </View>

            <Pressable style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Lucid Reminders</Text>
                <Text style={styles.settingDescription}>
                  Every {preferences.lucidRemindersInterval || 4} hours
                </Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </Pressable>
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>From</Text>
              <Text style={styles.settingValue}>{preferences.quietHoursStart}</Text>
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.settingLabel}>To</Text>
              <Text style={styles.settingValue}>{preferences.quietHoursEnd}</Text>
            </View>
          </View>
        </View>

        {/* Dream Wall */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.settingsGroup}>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dream Wall</Text>
                <Text style={styles.settingDescription}>
                  Share dreams anonymously with the community
                </Text>
              </View>
              <Switch
                value={preferences.dreamWallEnabled}
                onValueChange={(val) => updatePreferences({ dreamWallEnabled: val })}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        <Text style={styles.version}>DreamBound v1.0.0</Text>
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: spacing[16] },
  section: { marginBottom: spacing[6] },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
    marginLeft: spacing[1],
  },
  settingsGroup: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: { flex: 1, marginRight: spacing[3] },
  settingLabel: { ...typography.body, color: colors.textPrimary },
  settingDescription: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  settingValue: { ...typography.body, color: colors.textMuted },
  version: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing[4] },
});

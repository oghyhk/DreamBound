// ============================================================
// DreamBound — Profile Screen
// Account, settings, app preferences
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Settings,
  Moon,
  Bell,
  Sparkles,
  Download,
  Trash2,
  ChevronRight,
  LogOut,
  Crown,
} from 'lucide-react-native';
import { useUserStore } from '../../src/store/userStore';
import { useDreamStore } from '../../src/store/dreamStore';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import { exportAllData, clearAllData } from '../../src/services/storage';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const preferences = useUserStore((s) => s.preferences);
  const isPremium = useUserStore((s) => s.isPremium);
  const logout = useUserStore((s) => s.logout);
  const interpretationCreditsUsed = useUserStore((s) => s.interpretationCreditsUsed);
  const statistics = useDreamStore((s) => s.statistics);

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      Alert.alert('Export Ready', 'Your data is ready. In a production app, this would be saved to a file or shared.');
      console.log('Export data:', data.slice(0, 200));
    } catch (err) {
      Alert.alert('Export Failed', 'Could not export your data.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your dreams, sleep entries, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            logout();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ],
    );
  };

  const creditsRemaining = isPremium
    ? 'Unlimited'
    : `${Math.max(0, 3 - interpretationCreditsUsed)} / 3`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Account Card */}
        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.email?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountEmail}>{profile?.email ?? 'Not signed in'}</Text>
            <View style={styles.creditsRow}>
              {isPremium ? (
                <>
                  <Crown color={colors.accent} size={14} />
                  <Text style={styles.premiumLabel}>Premium</Text>
                </>
              ) : (
                <>
                  <Sparkles color={colors.primary} size={14} />
                  <Text style={styles.creditsText}>
                    {creditsRemaining} interpretations left
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Premium CTA */}
        {!isPremium && (
          <Pressable style={styles.premiumBanner}>
            <View style={styles.premiumBannerLeft}>
              <Crown color={colors.accent} size={20} />
              <View>
                <Text style={styles.premiumBannerTitle}>Go Premium</Text>
                <Text style={styles.premiumBannerSubtitle}>
                  Unlimited interpretations + advanced features
                </Text>
              </View>
            </View>
            <ChevronRight color={colors.accent} size={20} />
          </Pressable>
        )}

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics?.totalDreams ?? 0}</Text>
            <Text style={styles.statLabel}>Dreams</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics?.currentStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics?.lucidPercentage ?? 0}%</Text>
            <Text style={styles.statLabel}>Lucid</Text>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingsGroup}>
            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Moon color={colors.primary} size={20} />
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <View style={styles.toggle}>
                <View style={styles.toggleActive} />
              </View>
            </Pressable>

            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Bell color={colors.primary} size={20} />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <View style={styles.toggle}>
                <View
                  style={[
                    styles.toggleThumb,
                    preferences.notificationsEnabled && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              style={styles.settingRow}
              onPress={() => router.push('/(modals)/settings')}
            >
              <View style={styles.settingLeft}>
                <Sparkles color={colors.primary} size={20} />
                <Text style={styles.settingLabel}>AI Model</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>
                  {preferences.useMockAI ? 'Mock' : preferences.aiModel}
                </Text>
                <ChevronRight color={colors.textMuted} size={18} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <View style={styles.settingsGroup}>
            <Pressable style={styles.settingRow} onPress={handleExportData}>
              <View style={styles.settingLeft}>
                <Download color={colors.primary} size={20} />
                <Text style={styles.settingLabel}>Export Data</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </Pressable>

            <Pressable style={styles.settingRow} onPress={handleClearData}>
              <View style={styles.settingLeft}>
                <Trash2 color={colors.nightmare} size={20} />
                <Text style={[styles.settingLabel, { color: colors.nightmare }]}>
                  Clear All Data
                </Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </Pressable>
          </View>
        </View>

        {/* Sign Out */}
        <Pressable style={styles.signOutButton} onPress={logout}>
          <LogOut color={colors.error} size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>DreamBound v1.0.0</Text>
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
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: colors.white,
    fontSize: 24,
  },
  accountInfo: {
    flex: 1,
    gap: spacing[1],
  },
  accountEmail: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  premiumLabel: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  creditsText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  premiumBannerTitle: {
    ...typography.h3,
    color: colors.accent,
  },
  premiumBannerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[1],
  },
  section: {
    marginBottom: spacing[6],
  },
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  settingValue: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  signOutText: {
    ...typography.body,
    color: colors.error,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

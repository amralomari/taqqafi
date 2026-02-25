import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import {
  exportBackup,
  pickBackupFile,
  decryptBackup,
  restoreBackup,
  formatBackupDate,
} from "@/lib/backup";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    plan,
    transactions,
    pendingTransactions,
    budgets,
    refresh,
    smsPermissionGranted,
    requestSmsPermission,
  } = useApp();

  const [backupPassword, setBackupPassword] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showBackupSection, setShowBackupSection] = useState(false);
  const [showRestoreSection, setShowRestoreSection] = useState(false);

  const bottomPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const handleExportBackup = async () => {
    if (backupPassword.length < 4) {
      Alert.alert("Weak Password", "Please enter at least 4 characters for your backup password.");
      return;
    }
    setIsExporting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await exportBackup(backupPassword);
      Alert.alert("Backup Created", "Your encrypted backup has been saved. Store it safely — you'll need the password to restore it.");
      setBackupPassword("");
      setShowBackupSection(false);
    } catch (e: any) {
      Alert.alert("Backup Failed", e.message || "Could not create backup. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    if (restorePassword.length < 4) {
      Alert.alert("Password Required", "Enter the password you used when creating the backup.");
      return;
    }

    setIsImporting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const fileContent = await pickBackupFile();
      if (!fileContent) {
        setIsImporting(false);
        return;
      }

      const data = decryptBackup(fileContent, restorePassword);
      const backupDate = formatBackupDate(data.createdAt);

      Alert.alert(
        "Restore Backup",
        `Backup from ${backupDate}\n\n${data.transactions.length} transactions\n${data.budgets.length} budgets\n${data.pendingTransactions.length} pending\n\nHow would you like to restore?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsImporting(false) },
          {
            text: "Merge",
            onPress: async () => {
              try {
                const result = await restoreBackup(data, "merge");
                await refresh();
                Alert.alert(
                  "Restored",
                  `Merged ${result.transactions} new transactions, ${result.budgets} budgets, and ${result.pending} pending items.`
                );
                setRestorePassword("");
                setShowRestoreSection(false);
              } catch (e: any) {
                Alert.alert("Restore Failed", e.message);
              } finally {
                setIsImporting(false);
              }
            },
          },
          {
            text: "Replace All",
            style: "destructive",
            onPress: async () => {
              try {
                const result = await restoreBackup(data, "replace");
                await refresh();
                Alert.alert(
                  "Restored",
                  `Replaced with ${result.transactions} transactions, ${result.budgets} budgets, and ${result.pending} pending items.`
                );
                setRestorePassword("");
                setShowRestoreSection(false);
              } catch (e: any) {
                Alert.alert("Restore Failed", e.message);
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Import Failed", e.message || "Could not read or decrypt the backup file.");
      setIsImporting(false);
    }
  };

  const handleRequestSms = async () => {
    const granted = await requestSmsPermission();
    if (granted) {
      Alert.alert("Permission Granted", "SMS auto-detection is now active. Incoming bank messages will be detected automatically.");
    } else {
      Alert.alert("Permission Denied", "SMS permission is required to auto-detect bank transactions. You can enable it in your device settings.");
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Data Summary</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="receipt-outline" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
              {transactions.length} transactions
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.warningSubtle }]}>
              <Ionicons name="time-outline" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
              {pendingTransactions.length} pending
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.dangerSubtle }]}>
              <Ionicons name="speedometer-outline" size={18} color={colors.danger} />
            </View>
            <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
              {budgets.length} budgets
            </Text>
          </View>
        </View>
      </View>

      {Platform.OS === "android" && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SMS Auto-Detection</Text>
          <View style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.actionIcon, { backgroundColor: smsPermissionGranted ? colors.accentSubtle : colors.warningSubtle }]}>
              <Ionicons
                name={smsPermissionGranted ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                size={20}
                color={smsPermissionGranted ? colors.accent : colors.warning}
              />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                {smsPermissionGranted ? "Active" : "Disabled"}
              </Text>
              <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>
                {smsPermissionGranted
                  ? "Bank SMS will be detected automatically"
                  : "Grant permission to auto-detect transactions"}
              </Text>
            </View>
            {!smsPermissionGranted && (
              <Pressable
                style={[styles.enableBtn, { backgroundColor: colors.accent }]}
                onPress={handleRequestSms}
              >
                <Text style={[styles.enableBtnText, { color: isDark ? colors.bg : "#fff" }]}>Enable</Text>
              </Pressable>
            )}
            {smsPermissionGranted && (
              <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Backup & Restore</Text>

        <Pressable
          style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => {
            setShowBackupSection(!showBackupSection);
            setShowRestoreSection(false);
            Haptics.selectionAsync();
          }}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.accentSubtle }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Create Backup</Text>
            <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>
              Export encrypted backup file
            </Text>
          </View>
          <Ionicons
            name={showBackupSection ? "chevron-up" : "chevron-forward"}
            size={18}
            color={colors.textTertiary}
          />
        </Pressable>

        {showBackupSection && (
          <View style={[styles.expandedSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.expandedHint, { color: colors.textSecondary }]}>
              Your data will be AES-encrypted with the password you set below. Save the file to Google Drive, iCloud, or any storage of your choice.
            </Text>
            <View style={[styles.passwordWrap, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderLight }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary }]}
                value={backupPassword}
                onChangeText={setBackupPassword}
                placeholder="Set backup password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                selectionColor={colors.accent}
              />
            </View>
            <Pressable
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.accent },
                (isExporting || backupPassword.length < 4) && styles.btnDisabled,
              ]}
              onPress={handleExportBackup}
              disabled={isExporting || backupPassword.length < 4}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={isDark ? colors.bg : "#fff"} />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={16} color={isDark ? colors.bg : "#fff"} />
                  <Text style={[styles.primaryBtnText, { color: isDark ? colors.bg : "#fff" }]}>
                    Encrypt & Export
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        <Pressable
          style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => {
            setShowRestoreSection(!showRestoreSection);
            setShowBackupSection(false);
            Haptics.selectionAsync();
          }}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.warningSubtle }]}>
            <Ionicons name="cloud-download-outline" size={20} color={colors.warning} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Restore Backup</Text>
            <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>
              Import from encrypted backup file
            </Text>
          </View>
          <Ionicons
            name={showRestoreSection ? "chevron-up" : "chevron-forward"}
            size={18}
            color={colors.textTertiary}
          />
        </Pressable>

        {showRestoreSection && (
          <View style={[styles.expandedSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.expandedHint, { color: colors.textSecondary }]}>
              Select a .taqqafi backup file and enter the password used to create it. You can merge with existing data or replace everything.
            </Text>
            <View style={[styles.passwordWrap, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderLight }]}>
              <Ionicons name="lock-open-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary }]}
                value={restorePassword}
                onChangeText={setRestorePassword}
                placeholder="Enter backup password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                selectionColor={colors.accent}
              />
            </View>
            <Pressable
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.warning },
                (isImporting || restorePassword.length < 4) && styles.btnDisabled,
              ]}
              onPress={handleImportBackup}
              disabled={isImporting || restorePassword.length < 4}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color={isDark ? colors.bg : "#fff"} />
              ) : (
                <>
                  <Ionicons name="document-outline" size={16} color={isDark ? colors.bg : "#fff"} />
                  <Text style={[styles.primaryBtnText, { color: isDark ? colors.bg : "#fff" }]}>
                    Select Backup File
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Preferences</Text>

        <Pressable
          style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => {
            toggleTheme();
            Haptics.selectionAsync();
          }}
        >
          <View style={[styles.actionIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }]}>
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Theme</Text>
            <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>
              {isDark ? "Dark mode" : "Light mode"}
            </Text>
          </View>
          <View style={[styles.togglePill, { backgroundColor: isDark ? colors.accent : colors.textTertiary }]}>
            <View style={[styles.toggleDot, isDark ? styles.toggleDotRight : styles.toggleDotLeft]} />
          </View>
        </Pressable>

        <View style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.actionIcon, { backgroundColor: colors.warningSubtle }]}>
            <Ionicons name={plan === "PRO" ? "star" : "star-outline"} size={20} color={colors.warning} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Plan</Text>
            <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>
              {plan === "PRO" ? "PRO — All features unlocked" : "FREE — Upgrade via Google Play"}
            </Text>
          </View>
          <View style={[styles.planChip, { backgroundColor: plan === "PRO" ? colors.warningSubtle : colors.bgCardElevated }]}>
            <Text style={[styles.planChipText, { color: plan === "PRO" ? colors.warning : colors.textTertiary }]}>
              {plan}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>About</Text>
        <View style={[styles.aboutCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>1.0.0</Text>
          </View>
          <View style={[styles.aboutDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Data Storage</Text>
            <Text style={[styles.aboutValue, { color: colors.accent }]}>On-Device Only</Text>
          </View>
          <View style={[styles.aboutDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Encryption</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>AES-256</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 28 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  summaryCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 0 },
  summaryRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, paddingVertical: 10 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center" as const, justifyContent: "center" as const },
  summaryText: { fontSize: 15, fontFamily: "DMSans_500Medium" },
  summaryDivider: { height: 1 },
  actionCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center" as const, justifyContent: "center" as const },
  actionInfo: { flex: 1, gap: 2 },
  actionTitle: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  actionDesc: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  enableBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  enableBtnText: { fontSize: 13, fontFamily: "DMSans_700Bold" },
  expandedSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  expandedHint: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19 },
  passwordWrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  passwordInput: { flex: 1, fontSize: 15, fontFamily: "DMSans_500Medium", height: "100%" as any },
  primaryBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 15, fontFamily: "DMSans_700Bold" },
  togglePill: { width: 42, height: 24, borderRadius: 12, justifyContent: "center" as const, padding: 3 },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" },
  toggleDotLeft: { alignSelf: "flex-start" as const },
  toggleDotRight: { alignSelf: "flex-end" as const },
  planChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  planChipText: { fontSize: 12, fontFamily: "DMSans_700Bold" },
  aboutCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 0 },
  aboutRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, paddingVertical: 10 },
  aboutLabel: { fontSize: 14, fontFamily: "DMSans_400Regular" },
  aboutValue: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  aboutDivider: { height: 1 },
});

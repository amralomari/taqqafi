import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Pressable,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { TransactionCard } from "@/components/TransactionCard";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CURRENCIES, CurrencyCode } from "@/lib/currencies";
import * as Haptics from "expo-haptics";
import { exportTransactionsCSV } from "@/lib/exportExcel";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    totalSpentThisMonth,
    totalBudgetThisMonth,
    transactions,
    budgetSummaries,
    currentMonth,
    currentYear,
    pendingTransactions,
    isLoading,
    refresh,
    plan,
    currencyLabel,
    currency,
    setCurrency,
    smsPermissionGranted,
  } = useApp();

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const currencyList = Object.values(CURRENCIES);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0.6], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 80], [0, -10], Extrapolation.CLAMP),
      },
    ],
  }));

  const budgetPercent =
    totalBudgetThisMonth > 0
      ? Math.min(1, totalSpentThisMonth / totalBudgetThisMonth)
      : 0;

  const recentTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.month === currentMonth && t.year === currentYear)
        .slice(0, 10),
    [transactions, currentMonth, currentYear]
  );

  const topOverBudget = budgetSummaries.filter((s) => s.isOverBudget).slice(0, 2);

  const topCategory = useMemo(() => {
    const spending: Record<string, number> = {};
    for (const t of recentTransactions) {
      spending[t.category] = (spending[t.category] ?? 0) + t.amount;
    }
    const sorted = Object.entries(spending).sort((a, b) => b[1] - a[1]);
    return sorted[0];
  }, [recentTransactions]);

  const topInsets = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleExport = async () => {
    if (plan !== "PRO") {
      Alert.alert(
        "PRO Feature",
        "Export to CSV is available for PRO users. Upgrade to unlock this feature.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    if (transactions.length === 0) {
      Alert.alert("No Data", "There are no transactions to export.");
      return;
    }
    try {
      await exportTransactionsCSV(transactions);
    } catch (e) {
      Alert.alert("Export Failed", "Could not export transactions. Please try again.");
    }
  };

  const heroGradient = isDark
    ? (["#0F2027", "#203A43", "#111827"] as const)
    : (["#E8F5F0", "#D1EDE4", "#F0FAF7"] as const);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInsets + 20, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        <Animated.View style={[styles.header, headerAnim]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good day</Text>
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </Text>
          </View>
          <View style={styles.badges}>
            <Pressable onPress={() => router.push("/settings")} style={[styles.iconBadge, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Ionicons name="settings-outline" size={13} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={toggleTheme} style={[styles.iconBadge, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={13} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => setShowCurrencyPicker(true)} style={[styles.currencyBadge, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.currencyBadgeText, { color: colors.textSecondary }]}>{currencyLabel}</Text>
              <Ionicons name="chevron-down" size={10} color={colors.textSecondary} />
            </Pressable>
            <View style={[styles.privacyBadge, { backgroundColor: colors.accentSubtle, borderColor: colors.accentBorder }]}>
              <Ionicons name="lock-closed" size={11} color={colors.accent} />
              <Text style={[styles.privacyText, { color: colors.accent }]}>On-Device</Text>
            </View>
          </View>
        </Animated.View>

        {Platform.OS === "android" && smsPermissionGranted === false && (
          <Pressable
            style={[styles.smsPermBanner, { backgroundColor: colors.warningSubtle, borderColor: "rgba(245,158,11,0.2)" }]}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.warning} />
            <Text style={[styles.smsPermText, { color: colors.warning }]}>
              SMS auto-detection is disabled. Tap to enable in Settings.
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.warning} />
          </Pressable>
        )}

        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: colors.accentBorder }]}
        >
          <Text style={[styles.heroLabel, { color: isDark ? "rgba(255,255,255,0.5)" : colors.textSecondary }]}>Total Spent This Month</Text>
          <Text style={[styles.heroAmount, { color: colors.textPrimary }]}>
            {currencyLabel}{" "}
            {totalSpentThisMonth.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          {totalBudgetThisMonth > 0 && (
            <View style={styles.heroProgress}>
              <View style={[styles.heroBg, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
                <View
                  style={[
                    styles.heroFill,
                    {
                      width: `${Math.min(100, budgetPercent * 100)}%` as any,
                      backgroundColor:
                        budgetPercent > 0.9 ? colors.danger : budgetPercent > 0.75 ? colors.warning : colors.accent,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.heroRemaining, { color: isDark ? "rgba(255,255,255,0.5)" : colors.textSecondary }]}>
                {currencyLabel}{" "}
                {Math.max(0, totalBudgetThisMonth - totalSpentThisMonth).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                remaining
              </Text>
            </View>
          )}

          {totalBudgetThisMonth === 0 && (
            <Text style={[styles.heroBudgetHint, { color: isDark ? "rgba(255,255,255,0.35)" : colors.textTertiary }]}>
              Set budgets in the Budgets tab to track limits
            </Text>
          )}
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{recentTransactions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningSubtle }]}>
              <Ionicons name="time" size={16} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{pendingTransactions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.dangerSubtle }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{topOverBudget.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Over Limit</Text>
          </View>
        </View>

        {topOverBudget.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Budget Alerts</Text>
            {topOverBudget.map((s) => (
              <View key={s.budget.id} style={[styles.alertCard, { backgroundColor: colors.dangerSubtle }]}>
                <Ionicons name="warning" size={16} color={colors.danger} />
                <Text style={[styles.alertText, { color: colors.danger }]}>
                  <Text style={styles.alertCat}>{s.budget.category}</Text>
                  {" "}is over budget by {currencyLabel}{" "}
                  {(s.spent - s.budget.monthlyLimit).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {topCategory && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Category</Text>
            <View style={[styles.topCatCard, { backgroundColor: colors.warningSubtle }]}>
              <Ionicons name="flame" size={18} color={colors.warning} />
              <Text style={[styles.topCatText, { color: colors.warning }]}>
                <Text style={styles.topCatName}>{topCategory[0]}</Text>
                {" · "}{currencyLabel} {topCategory[1].toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}this month
              </Text>
            </View>
          </View>
        )}

        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Pressable onPress={handleExport} style={styles.exportBtn}>
                  <Ionicons name="download-outline" size={15} color={colors.accent} />
                </Pressable>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.accent} />
              </View>
            </View>
            <View style={styles.list}>
              {recentTransactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onPress={() => router.push({ pathname: "/edit/[id]", params: { id: tx.id, type: "approved" } })}
                />
              ))}
            </View>
          </View>
        )}

        {recentTransactions.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No transactions yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              Incoming bank SMS will be detected automatically, or tap + to add an expense manually.
            </Text>
          </View>
        )}
      </AnimatedScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 90, backgroundColor: colors.accent, shadowColor: colors.accent }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/add-expense");
        }}
      >
        <Ionicons name="add" size={28} color={isDark ? colors.bg : "#fff"} />
      </Pressable>

      <Modal visible={showCurrencyPicker} transparent animationType="slide" onRequestClose={() => setShowCurrencyPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Currency</Text>
              <Pressable onPress={() => setShowCurrencyPicker(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={currencyList}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.currencyRow, item.code === currency && { backgroundColor: colors.accentSubtle }]}
                  onPress={() => {
                    setCurrency(item.code as CurrencyCode);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={[styles.currencyRowCode, { color: colors.textPrimary }]}>{item.code}</Text>
                  <Text style={[styles.currencyRowName, { color: colors.textSecondary }]}>{item.name}</Text>
                  {item.code === currency && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={[styles.currencyDivider, { backgroundColor: colors.border }]} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  greeting: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  monthLabel: { fontSize: 22, fontFamily: "DMSans_700Bold", marginTop: 2 },
  badges: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  privacyText: { fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  smsPermBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  smsPermText: { flex: 1, fontSize: 13, fontFamily: "DMSans_500Medium", lineHeight: 18 },
  heroCard: { borderRadius: 22, padding: 24, gap: 12, borderWidth: 1 },
  heroLabel: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  heroAmount: { fontSize: 38, fontFamily: "DMSans_700Bold", letterSpacing: -0.5 },
  heroProgress: { gap: 8 },
  heroBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  heroFill: { height: "100%", borderRadius: 3 },
  heroRemaining: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  heroBudgetHint: { fontSize: 12, fontFamily: "DMSans_400Regular", fontStyle: "italic" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontFamily: "DMSans_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  exportBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  alertText: { flex: 1, fontSize: 13, fontFamily: "DMSans_400Regular" },
  alertCat: { fontFamily: "DMSans_700Bold" },
  topCatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  topCatText: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  topCatName: { fontFamily: "DMSans_700Bold" },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  currencyBadgeText: { fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "60%", paddingBottom: 34 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  currencyRowCode: { fontSize: 15, fontFamily: "DMSans_700Bold", width: 48 },
  currencyRowName: { flex: 1, fontSize: 14, fontFamily: "DMSans_400Regular" },
  currencyDivider: { height: 1, marginHorizontal: 20 },
  fab: {
    position: "absolute" as const,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  list: { gap: 8 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "DMSans_600SemiBold" },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 20,
  },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { BudgetCard } from "@/components/BudgetCard";
import * as Haptics from "expo-haptics";

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { budgetSummaries, budgets, removeBudget, isLoading, refresh, plan, currencyLabel } = useApp();

  const topInsets = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleDelete = (id: string, category: string) => {
    Alert.alert(
      `Delete ${category} Budget`,
      "This will remove the budget. Approved transactions are not affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await removeBudget(id);
          },
        },
      ]
    );
  };

  const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalOverBudget = budgetSummaries.filter((s) => s.isOverBudget).length;
  const totalOnTrack = budgetSummaries.filter((s) => !s.isOverBudget && s.percent < 0.8).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <FlatList
        data={budgetSummaries}
        keyExtractor={(item) => item.budget.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: topInsets + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Budgets</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Monthly spending limits</Text>
              </View>
              <Pressable
                style={[styles.addBtn, { backgroundColor: colors.accent }]}
                onPress={() => router.push("/budget-form")}
              >
                <Ionicons name="add" size={22} color={isDark ? colors.bg : "#fff"} />
              </Pressable>
            </View>

            {budgets.length > 0 && (
              <View style={[styles.summaryRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                    {currencyLabel} {totalBudget.toLocaleString("en-SA")}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Total Budget</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: totalOnTrack > 0 ? colors.accent : colors.textSecondary }]}>
                    {totalOnTrack}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>On Track</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: totalOverBudget > 0 ? colors.danger : colors.textSecondary }]}>
                    {totalOverBudget}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Over Limit</Text>
                </View>
              </View>
            )}

            {plan === "FREE" && budgets.length >= 3 && (
              <View style={[styles.proBanner, { backgroundColor: colors.warningSubtle }]}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={[styles.proBannerText, { color: colors.warning }]}>
                  Free plan is limited to 3 budgets. Upgrade to PRO for unlimited.
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="speedometer-outline" size={48} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No budgets yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Set monthly limits per category to track your spending.
            </Text>
            <Pressable
              style={[styles.emptyAddBtn, { backgroundColor: colors.accentSubtle, borderColor: colors.accentBorder }]}
              onPress={() => router.push("/budget-form")}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
              <Text style={[styles.emptyAddText, { color: colors.accent }]}>Add First Budget</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <BudgetCard
            summary={item}
            onEdit={() => router.push("/budget-form")}
            onDelete={() => handleDelete(item.budget.id, item.budget.category)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: 20 },
  header: { gap: 16, marginBottom: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontFamily: "DMSans_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "DMSans_400Regular", marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryDivider: { width: 1, marginHorizontal: 8 },
  summaryValue: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  summaryLabel: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  proBannerText: { flex: 1, fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 60, gap: 14, paddingHorizontal: 20 },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontFamily: "DMSans_700Bold" },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  emptyAddText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
});

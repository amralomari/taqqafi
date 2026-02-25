import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { BudgetSummary } from "@/lib/storage";
import { getCategoryIcon } from "@/lib/categoryMapper";
import { useApp } from "@/context/AppContext";

type Props = {
  summary: BudgetSummary;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function BudgetCard({ summary, onEdit, onDelete }: Props) {
  const { currencyLabel } = useApp();
  const { colors } = useTheme();
  const { budget, spent, remaining, percent, isOverBudget } = summary;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = colors.categoryColors[budget.category] ?? colors.categoryColors.Misc;
  const subtle = colors.categorySubtle[budget.category] ?? colors.categorySubtle.Misc;
  const icon = getCategoryIcon(budget.category);

  const barColor = isOverBudget
    ? colors.danger
    : percent > 0.8
    ? colors.warning
    : colors.accent;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onEdit}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[styles.container, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      >
        <View style={styles.header}>
          <View style={styles.left}>
            <View style={[styles.iconWrap, { backgroundColor: subtle }]}>
              <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <View>
              <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{budget.category}</Text>
              <Text style={[styles.limitLabel, { color: colors.textTertiary }]}>
                Limit: {currencyLabel} {budget.monthlyLimit.toLocaleString("en-SA")}
              </Text>
            </View>
          </View>

          <View style={styles.right}>
            <Text
              style={[
                styles.remaining,
                { color: isOverBudget ? colors.danger : colors.accent },
              ]}
            >
              {isOverBudget ? "-" : ""}
              {Math.abs(isOverBudget ? spent - budget.monthlyLimit : remaining).toLocaleString(
                "en-SA",
                { minimumFractionDigits: 0, maximumFractionDigits: 0 }
              )}
            </Text>
            <Text style={[styles.remainingLabel, { color: colors.textTertiary }]}>
              {isOverBudget ? "over" : "left"}
            </Text>
          </View>
        </View>

        <View style={[styles.barBg, { backgroundColor: colors.bgCardElevated }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, percent * 100)}%` as any,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.spentText, { color: colors.textSecondary }]}>
            {currencyLabel} {spent.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent
          </Text>
          <Text style={[styles.percentText, { color: barColor }]}>
            {Math.round(percent * 100)}%
          </Text>
        </View>

        {onDelete && (
          <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={10}>
            <Ionicons name="trash-outline" size={14} color={colors.textTertiary} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
  },
  limitLabel: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 1,
  },
  right: { alignItems: "flex-end" },
  remaining: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
  },
  remainingLabel: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 1,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spentText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  percentText: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
  },
  deleteBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
  },
});

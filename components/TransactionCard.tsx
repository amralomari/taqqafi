import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { Transaction } from "@/lib/storage";
import { CategoryBadge } from "./CategoryBadge";
import { getCategoryIcon } from "@/lib/categoryMapper";
import { useApp } from "@/context/AppContext";

type Props = {
  transaction: Transaction;
  onPress?: () => void;
};

export function TransactionCard({ transaction, onPress }: Props) {
  const { currencyLabel } = useApp();
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color =
    colors.categoryColors[transaction.category] ??
    colors.categoryColors.Misc;
  const subtle =
    colors.categorySubtle[transaction.category] ??
    colors.categorySubtle.Misc;
  const icon = getCategoryIcon(transaction.category);

  const date = new Date(transaction.approvedAt);
  const dateStr = date.toLocaleDateString("en-SA", {
    day: "numeric",
    month: "short",
  });
  const timeStr = date.toLocaleTimeString("en-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[styles.container, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: subtle }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.merchant, { color: colors.textPrimary }]} numberOfLines={1}>
            {transaction.merchant}
          </Text>
          <View style={styles.meta}>
            <CategoryBadge category={transaction.category} size="sm" />
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {dateStr} · {timeStr}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={[styles.amount, { color: colors.danger }]}>
            -{transaction.amount.toLocaleString("en-SA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={[styles.currency, { color: colors.textTertiary }]}>{currencyLabel}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 5 },
  merchant: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  date: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  right: { alignItems: "flex-end" },
  amount: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },
  currency: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
});

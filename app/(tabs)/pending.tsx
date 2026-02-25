import React, { useState } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInDown,
  FadeOutUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { PendingTransaction } from "@/lib/storage";
import { CategoryBadge } from "@/components/CategoryBadge";

function PendingCard({ tx, onApprove, onDismiss, onEdit, currencyLabel }: {
  tx: PendingTransaction;
  onApprove: () => void;
  onDismiss: () => void;
  onEdit: () => void;
  currencyLabel: string;
}) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = colors.categoryColors[tx.category] ?? colors.categoryColors.Misc;
  const subtle = colors.categorySubtle[tx.category] ?? colors.categorySubtle.Misc;

  const timeAgo = getTimeAgo(tx.receivedAt);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(20)}
      exiting={FadeOutUp.duration(200)}
      style={animStyle}
    >
      <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.cardTime, { color: colors.textTertiary }]}>{timeAgo}</Text>
          </View>
          <View style={[styles.pendingChip, { backgroundColor: colors.warningSubtle }]}>
            <Text style={[styles.pendingChipText, { color: colors.warning }]}>Awaiting approval</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardAmount, { color: colors.textPrimary }]}>
            {currencyLabel} {tx.amount.toLocaleString("en-SA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={[styles.cardMerchant, { color: colors.textSecondary }]} numberOfLines={1}>
            {tx.merchant}
          </Text>
          <CategoryBadge category={tx.category} />
        </View>

        <View style={[styles.smsPreview, { backgroundColor: colors.bgCardElevated, borderColor: colors.separator }]}>
          <Ionicons name="chatbubble-outline" size={11} color={colors.textTertiary} />
          <Text style={[styles.smsPreviewText, { color: colors.textTertiary }]} numberOfLines={2}>
            {tx.rawText}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.dismissBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
            onPress={onDismiss}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
            <Text style={[styles.dismissText, { color: colors.textSecondary }]}>Dismiss</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.editBtn, { backgroundColor: colors.accentSubtle, borderColor: colors.accentBorder }]}
            onPress={onEdit}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.accent} />
            <Text style={[styles.editText, { color: colors.accent }]}>Edit</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.accent }]}
            onPress={() => {
              scale.value = withSequence(withSpring(0.96), withSpring(1));
              onApprove();
            }}
          >
            <Ionicons name="checkmark" size={18} color={isDark ? colors.bg : "#fff"} />
            <Text style={[styles.approveText, { color: isDark ? colors.bg : "#fff" }]}>Approve</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function PendingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { pendingTransactions, approvePending, dismissPending, isLoading, refresh, currencyLabel } = useApp();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const topInsets = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleApprove = async (tx: PendingTransaction) => {
    setProcessingId(tx.id);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await approvePending(tx);
    setProcessingId(null);
  };

  const handleDismiss = async (id: string) => {
    Alert.alert(
      "Dismiss Transaction",
      "This will remove the pending transaction without saving it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dismiss",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await dismissPending(id);
          },
        },
      ]
    );
  };

  const handleEdit = (tx: PendingTransaction) => {
    router.push({
      pathname: "/edit/[id]",
      params: { id: tx.id, type: "pending" },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <FlatList
        data={pendingTransactions}
        keyExtractor={(item) => item.id}
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Pending</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {pendingTransactions.length > 0
                ? `${pendingTransactions.length} transaction${pendingTransactions.length > 1 ? "s" : ""} awaiting review`
                : "All clear"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="checkmark-done-circle-outline" size={52} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All caught up</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              New SMS transactions will appear here for your approval. Use the simulator on the Dashboard to test.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PendingCard
            tx={item}
            onApprove={() => handleApprove(item)}
            onDismiss={() => handleDismiss(item.id)}
            onEdit={() => handleEdit(item)}
            currencyLabel={currencyLabel}
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
  header: { marginBottom: 20, gap: 4 },
  title: { fontSize: 28, fontFamily: "DMSans_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "DMSans_400Regular" },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardDot: { width: 7, height: 7, borderRadius: 3.5 },
  cardTime: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  pendingChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
  },
  pendingChipText: { fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  cardBody: { gap: 6 },
  cardAmount: { fontSize: 28, fontFamily: "DMSans_700Bold", letterSpacing: -0.3 },
  cardMerchant: { fontSize: 16, fontFamily: "DMSans_500Medium" },
  smsPreview: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  smsPreviewText: { flex: 1, fontSize: 11, fontFamily: "DMSans_400Regular", lineHeight: 16 },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    flex: 1,
  },
  dismissBtn: { borderWidth: 1 },
  dismissText: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  editBtn: { borderWidth: 1 },
  editText: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  approveBtn: { flex: 1.3 },
  approveText: { fontSize: 13, fontFamily: "DMSans_700Bold" },
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
});

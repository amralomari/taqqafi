import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { ALL_CATEGORIES, Category, getCategoryIcon } from "@/lib/categoryMapper";

export default function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { addManualTransaction, currencyLabel } = useApp();

  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<Category>("Misc");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0.");
      return;
    }
    if (!merchant.trim()) {
      Alert.alert("Missing Merchant", "Please enter a merchant name.");
      return;
    }

    setIsSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await addManualTransaction(parsedAmount, merchant.trim(), category, new Date());
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Amount ({currencyLabel})</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
          <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>{currencyLabel}</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.textPrimary }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.accent}
            autoFocus
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Merchant</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
          <TextInput
            style={[styles.input, { flex: 1, color: colors.textPrimary }]}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="e.g. Starbucks"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.accent}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Category</Text>
        <View style={styles.categoryGrid}>
          {ALL_CATEGORIES.map((cat) => {
            const selected = category === cat;
            const color = colors.categoryColors[cat] ?? colors.categoryColors.Misc;
            const subtle = colors.categorySubtle[cat] ?? colors.categorySubtle.Misc;
            const icon = getCategoryIcon(cat);

            return (
              <Pressable
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.catCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                  selected && { backgroundColor: subtle, borderColor: `${color}60` },
                ]}
              >
                <View
                  style={[
                    styles.catIcon,
                    { backgroundColor: selected ? `${color}30` : colors.bgCardElevated },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={selected ? color : colors.textSecondary}
                  />
                </View>
                <Text style={[styles.catName, { color: selected ? color : colors.textSecondary }]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={[styles.saveBtn, { backgroundColor: colors.accent }, isSaving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Ionicons name="checkmark-circle" size={18} color={isDark ? colors.bg : "#fff"} />
        <Text style={[styles.saveBtnText, { color: isDark ? colors.bg : "#fff" }]}>Add Expense</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  inputWrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 58,
    gap: 10,
  },
  inputPrefix: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    height: "100%" as any,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
    height: "100%" as any,
  },
  categoryGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
  },
  catCard: {
    width: "47%" as any,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  catName: { fontSize: 13, fontFamily: "DMSans_600SemiBold", flex: 1 },
  saveBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontFamily: "DMSans_700Bold" },
});

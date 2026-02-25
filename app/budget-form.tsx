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
import { canAddBudget } from "@/lib/featureGate";

export default function BudgetFormScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { addBudget, budgets, plan, currentMonth, currentYear, currencyLabel } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [limit, setLimit] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const existingCategories = new Set(
    budgets
      .filter((b) => b.month === currentMonth && b.year === currentYear)
      .map((b) => b.category)
  );

  const canAdd = canAddBudget(budgets.length, plan);

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert("Select Category", "Please select a category for this budget.");
      return;
    }
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      Alert.alert("Invalid Limit", "Please enter a limit greater than 0.");
      return;
    }
    if (!canAdd) {
      Alert.alert("Free Plan Limit", "Upgrade to PRO to add more than 3 budgets.");
      return;
    }

    setIsSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await addBudget(selectedCategory, parsedLimit, currentMonth, currentYear);
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
      {!canAdd && (
        <View style={[styles.proBanner, { backgroundColor: colors.warningSubtle }]}>
          <Ionicons name="star" size={16} color={colors.warning} />
          <Text style={[styles.proBannerText, { color: colors.warning }]}>
            You've reached the FREE plan limit of 3 budgets. Upgrade to PRO for unlimited budgets.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Category</Text>
        <View style={styles.categoryGrid}>
          {ALL_CATEGORIES.map((cat) => {
            const selected = selectedCategory === cat;
            const alreadySet = existingCategories.has(cat);
            const color = colors.categoryColors[cat] ?? colors.categoryColors.Misc;
            const subtle = colors.categorySubtle[cat] ?? colors.categorySubtle.Misc;
            const icon = getCategoryIcon(cat);

            return (
              <Pressable
                key={cat}
                onPress={() => {
                  if (alreadySet) {
                    Alert.alert("Budget Exists", `You already have a budget for ${cat} this month.`);
                    return;
                  }
                  setSelectedCategory(cat);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.catCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                  selected && { backgroundColor: subtle, borderColor: `${color}60` },
                  alreadySet && styles.catCardDisabled,
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
                <Text
                  style={[
                    styles.catName,
                    { color: selected ? color : colors.textSecondary },
                    alreadySet && { opacity: 0.4 },
                  ]}
                >
                  {cat}
                </Text>
                {alreadySet && (
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={colors.accent}
                    style={styles.alreadySetIcon}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Monthly Limit</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
          <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>{currencyLabel}</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={limit}
            onChangeText={setLimit}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.accent}
          />
        </View>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Spending beyond this limit will trigger a budget alert.
        </Text>
      </View>

      <Pressable
        style={[styles.saveBtn, { backgroundColor: colors.accent }, (!canAdd || isSaving) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!canAdd || isSaving}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color={isDark ? colors.bg : "#fff"} />
        <Text style={[styles.saveBtnText, { color: isDark ? colors.bg : "#fff" }]}>Save Budget</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  proBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  proBannerText: { flex: 1, fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    position: "relative",
  },
  catCardDisabled: { opacity: 0.6 },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: { fontSize: 13, fontFamily: "DMSans_600SemiBold", flex: 1 },
  alreadySetIcon: { position: "absolute", top: 6, right: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 58,
    gap: 10,
  },
  inputPrefix: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  input: { flex: 1, fontSize: 22, fontFamily: "DMSans_700Bold", height: "100%" },
  hint: { fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 17 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontFamily: "DMSans_700Bold" },
});

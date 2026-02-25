import React, { useState, useEffect, useMemo } from "react";
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
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { ALL_CATEGORIES, Category } from "@/lib/categoryMapper";
import { PendingTransaction, Transaction } from "@/lib/storage";
import { CURRENCIES, CurrencyCode, getCurrencyByCode } from "@/lib/currencies";
import { convertAmount } from "@/lib/currencyRates";

export default function EditTransactionScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    pendingTransactions,
    transactions,
    editPendingAndApprove,
    dismissPending,
    updateApprovedTransaction,
    deleteApprovedTransaction,
    currencyLabel,
    currency,
  } = useApp();

  const isPending = type === "pending";

  const sourceTx = isPending
    ? pendingTransactions.find((t) => t.id === id)
    : transactions.find((t) => t.id === id);

  const [merchant, setMerchant] = useState(sourceTx?.merchant ?? "");
  const [amount, setAmount] = useState(String(sourceTx?.amount?.toFixed(2) ?? "0.00"));
  const [category, setCategory] = useState<Category>(sourceTx?.category ?? "Misc");
  const [isSaving, setIsSaving] = useState(false);
  const [convertFrom, setConvertFrom] = useState<CurrencyCode | null>(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const displayCurrency = currency as CurrencyCode;

  const convertedPreview = useMemo(() => {
    if (!convertFrom || convertFrom === displayCurrency) return null;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return null;
    return convertAmount(parsed, convertFrom, displayCurrency);
  }, [convertFrom, displayCurrency, amount]);

  useEffect(() => {
    if (!sourceTx) router.back();
  }, [sourceTx]);

  if (!sourceTx) return null;

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0.");
      return;
    }
    const finalAmount = convertedPreview ?? parsedAmount;
    if (!merchant.trim()) {
      Alert.alert("Missing Merchant", "Please enter a merchant name.");
      return;
    }

    setIsSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (isPending) {
        const updated: PendingTransaction = {
          ...(sourceTx as PendingTransaction),
          merchant: merchant.trim(),
          amount: finalAmount,
          category,
        };
        await editPendingAndApprove(updated);
        router.back();
      } else {
        const updated: Transaction = {
          ...(sourceTx as Transaction),
          merchant: merchant.trim(),
          amount: finalAmount,
          category,
        };
        await updateApprovedTransaction(updated);
        router.back();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      isPending
        ? "Dismiss this pending transaction?"
        : "Delete this approved transaction? Budget calculations will update.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (isPending) {
              await dismissPending(sourceTx.id);
            } else {
              await deleteApprovedTransaction(sourceTx.id);
            }
            router.back();
          },
        },
      ]
    );
  };

  const bottomPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Original SMS</Text>
        <View style={[styles.smsBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.smsText, { color: colors.textSecondary }]}>{sourceTx.rawText}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Amount ({currencyLabel})</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
          <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>{currencyLabel}</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.accent}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Convert From</Text>
        <Pressable
          style={[styles.convertPickerBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
        >
          <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
          <Text style={[styles.convertPickerText, { color: colors.textSecondary }]}>
            {convertFrom
              ? `${getCurrencyByCode(convertFrom).name} (${convertFrom})`
              : "Select source currency"}
          </Text>
          <Ionicons
            name={showCurrencyPicker ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>

        {showCurrencyPicker && (
          <ScrollView
            style={[styles.currencyList, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              style={[styles.currencyOption, { borderBottomColor: colors.separator }, !convertFrom && { backgroundColor: colors.accentSubtle }]}
              onPress={() => {
                setConvertFrom(null);
                setShowCurrencyPicker(false);
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.currencyOptionText, { color: !convertFrom ? colors.accent : colors.textPrimary }]}>
                No conversion
              </Text>
            </Pressable>
            {CURRENCIES.filter((c) => c.code !== displayCurrency).map((c) => {
              const selected = convertFrom === c.code;
              return (
                <Pressable
                  key={c.code}
                  style={[
                    styles.currencyOption,
                    { borderBottomColor: colors.separator },
                    selected && { backgroundColor: colors.accentSubtle },
                  ]}
                  onPress={() => {
                    setConvertFrom(c.code);
                    setShowCurrencyPicker(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.currencyOptionText, { color: selected ? colors.accent : colors.textPrimary }]}>
                    {c.name} ({c.code}) {c.symbol}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {convertFrom && convertedPreview !== null && (
          <View style={[styles.conversionPreview, { backgroundColor: colors.bgCard, borderColor: colors.accentBorder }]}>
            <View style={styles.conversionRow}>
              <Text style={[styles.conversionLabel, { color: colors.textSecondary }]}>Original</Text>
              <Text style={[styles.conversionValue, { color: colors.textPrimary }]}>
                {convertFrom} {parseFloat(amount).toFixed(2)}
              </Text>
            </View>
            <Ionicons name="arrow-down" size={16} color={colors.accent} style={{ alignSelf: "center" }} />
            <View style={styles.conversionRow}>
              <Text style={[styles.conversionLabel, { color: colors.textSecondary }]}>Converted</Text>
              <Text style={[styles.conversionValue, { color: colors.accent }]}>
                {currencyLabel} {convertedPreview.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
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
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.catChip,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                  selected && { backgroundColor: subtle, borderColor: `${color}50` },
                ]}
              >
                <Text style={[styles.catChipText, { color: selected ? color : colors.textSecondary }]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons
            name={isPending ? "checkmark-circle" : "save-outline"}
            size={18}
            color={isDark ? colors.bg : "#fff"}
          />
          <Text style={[styles.saveBtnText, { color: isDark ? colors.bg : "#fff" }]}>
            {isPending ? "Approve Transaction" : "Save Changes"}
          </Text>
        </Pressable>

        <Pressable style={[styles.deleteBtn, { backgroundColor: colors.dangerSubtle }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
            {isPending ? "Dismiss" : "Delete Transaction"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  smsBox: { borderRadius: 12, padding: 14, borderWidth: 1 },
  smsText: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 54,
    gap: 8,
  },
  inputPrefix: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  input: { flex: 1, fontSize: 16, fontFamily: "DMSans_500Medium", height: "100%" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  actions: { gap: 10, marginTop: 8 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    padding: 16,
  },
  saveBtnText: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  deleteBtnText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  convertPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  convertPickerText: { flex: 1, fontSize: 14, fontFamily: "DMSans_500Medium" },
  currencyList: { maxHeight: 200, borderRadius: 12, borderWidth: 1 },
  currencyOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  currencyOptionText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  conversionPreview: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  conversionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  conversionLabel: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  conversionValue: { fontSize: 15, fontFamily: "DMSans_700Bold" },
});

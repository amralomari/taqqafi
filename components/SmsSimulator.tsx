import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";

const DEMO_SMS = [
  {
    sender: "ALRAJHI",
    label: "Al Rajhi Debit",
    body: "Al-Rajhi Bank: SAR 89.50 deducted from your account for purchase at McDonald's. Available balance: SAR 4,210.00",
  },
  {
    sender: "STC-PAY",
    label: "STC Pay",
    body: "STC Pay: Payment of SAR 45.00 to Starbucks Coffee was successful. Ref: TXN8821234",
  },
  {
    sender: "SNB",
    label: "Saudi National",
    body: "SNB Alert: SAR 1,250.00 deducted. Merchant: Amazon.sa. Date: 25/02/2026. Available balance: SAR 8,750.00",
  },
  {
    sender: "RIYAL-BANK",
    label: "Riyad Bank (Arabic)",
    body: "Riyad Bank: تم خصم مبلغ 350.00 ر.س من حسابك لدى مطعم البيك. الرصيد المتاح: 12,300.00 ر.س",
  },
  {
    sender: "ALBILAD",
    label: "Al Bilad",
    body: "Bank AlBilad: SAR 180.00 charged at IKEA Riyadh. Transaction Ref: 887231. Date: 25-Feb-2026",
  },
  {
    sender: "ALINMA",
    label: "Alinma Digital",
    body: "Alinma Bank: Purchase of SAR 65.75 at Careem Ride successful. Your card ending 4521 was used.",
  },
  {
    sender: "NCB",
    label: "NCB (AlAhli)",
    body: "AlAhli Bank: SAR 2,100.00 deducted from account for STC monthly subscription payment. Ref: STC20260225",
  },
  {
    sender: "JORDAN-BANK",
    label: "Jordan Card (USD)",
    body: "You have purchase transaction with amount 18.44 USD on your credit card no. 9379 from UBER   * PENDING     and your available balance is 984.862 JOD",
  },
  {
    sender: "JORDAN-BANK",
    label: "Jordan E-Payment (AR)",
    body: "تسديد الكتروني من حسابكم 0792707 - 001 بقيمة 1.0 دينار اردني الرصيد المتوفر 15.219 دينار اردني",
  },
];

type SimButtonProps = {
  sms: (typeof DEMO_SMS)[0];
  onSend: (sms: (typeof DEMO_SMS)[0]) => void;
  isLoading: boolean;
};

function SimButton({ sms, onSend, isLoading }: SimButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          scale.value = withSequence(withSpring(0.94), withSpring(1));
          onSend(sms);
        }}
        disabled={isLoading}
        style={[
          styles.simBtn,
          { backgroundColor: colors.bgCardElevated, borderColor: colors.border },
          isLoading && styles.simBtnDisabled,
        ]}
      >
        <View style={[styles.simBtnIcon, { backgroundColor: colors.accentSubtle }]}>
          <Ionicons name="chatbubble-outline" size={13} color={colors.accent} />
        </View>
        <View style={styles.simBtnInfo}>
          <Text style={[styles.simBtnLabel, { color: colors.textPrimary }]}>{sms.label}</Text>
          <Text style={[styles.simBtnSender, { color: colors.textTertiary }]}>{sms.sender}</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons name="send" size={14} color={colors.accent} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export function SmsSimulator() {
  const { processSmsMessage } = useApp();
  const { colors, isDark } = useTheme();
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [customSms, setCustomSms] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const handleSend = async (sms: (typeof DEMO_SMS)[0], idx: number) => {
    setLoadingIdx(idx);
    setLastResult(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const detected = await processSmsMessage(sms.body, sms.sender);
      setLastResult(
        detected
          ? "Transaction detected — check Pending tab"
          : "Duplicate or not recognized"
      );
    } catch {
      setLastResult("Parse error");
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleCustomSend = async () => {
    if (!customSms.trim()) return;
    setCustomLoading(true);
    setLastResult(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const detected = await processSmsMessage(customSms.trim(), "CUSTOM");
      setLastResult(
        detected
          ? "Transaction detected — check Pending tab"
          : "Not recognized as financial SMS"
      );
      if (detected) setCustomSms("");
    } catch {
      setLastResult("Parse error — check SMS format");
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard, borderColor: "rgba(245, 158, 11, 0.2)" }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.demoIcon, { backgroundColor: colors.warningSubtle }]}>
            <Ionicons name="flask-outline" size={14} color={colors.warning} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.warning }]}>SMS Simulator</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Demo mode · Tap preset or write your own
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowCustom(!showCustom)}
          style={[styles.toggleBtn, { backgroundColor: colors.accentSubtle, borderColor: colors.accentBorder }]}
        >
          <Ionicons
            name={showCustom ? "chevron-up" : "create-outline"}
            size={16}
            color={colors.accent}
          />
        </Pressable>
      </View>

      {lastResult && (
        <View
          style={[
            styles.resultBanner,
            lastResult.includes("detected")
              ? { backgroundColor: colors.accentSubtle }
              : { backgroundColor: colors.warningSubtle },
          ]}
        >
          <Ionicons
            name={lastResult.includes("detected") ? "checkmark-circle-outline" : "alert-circle-outline"}
            size={14}
            color={lastResult.includes("detected") ? colors.accent : colors.warning}
          />
          <Text
            style={[
              styles.resultText,
              { color: lastResult.includes("detected") ? colors.accent : colors.warning },
            ]}
          >
            {lastResult}
          </Text>
        </View>
      )}

      {showCustom && (
        <View style={styles.customSection}>
          <TextInput
            style={[styles.customInput, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderLight, color: colors.textPrimary }]}
            value={customSms}
            onChangeText={setCustomSms}
            placeholder="Paste or type a bank SMS here...&#10;e.g. SAR 120.00 deducted at Jarir Bookstore"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            selectionColor={colors.accent}
          />
          <Pressable
            style={[
              styles.customSendBtn,
              { backgroundColor: colors.accent },
              (!customSms.trim() || customLoading) && styles.customSendDisabled,
            ]}
            onPress={handleCustomSend}
            disabled={!customSms.trim() || customLoading}
          >
            {customLoading ? (
              <ActivityIndicator size="small" color={isDark ? colors.bg : "#fff"} />
            ) : (
              <>
                <Ionicons name="paper-plane" size={15} color={isDark ? colors.bg : "#fff"} />
                <Text style={[styles.customSendText, { color: isDark ? colors.bg : "#fff" }]}>Process SMS</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DEMO_SMS.map((sms, idx) => (
          <SimButton
            key={idx}
            sms={sms}
            onSend={(s) => handleSend(s, idx)}
            isLoading={loadingIdx === idx}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  demoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 1,
  },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  customSection: { gap: 10 },
  customInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    minHeight: 80,
    lineHeight: 19,
  },
  customSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  customSendDisabled: { opacity: 0.4 },
  customSendText: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  scrollContent: { gap: 8, paddingRight: 4 },
  simBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    minWidth: 150,
  },
  simBtnDisabled: { opacity: 0.5 },
  simBtnIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  simBtnInfo: { flex: 1 },
  simBtnLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
  },
  simBtnSender: {
    fontSize: 10,
    fontFamily: "DMSans_400Regular",
  },
});

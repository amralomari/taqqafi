const palette = {
  navy900: "#070B14",
  navy800: "#0D1422",
  navy700: "#111827",
  navy600: "#1A2235",
  navy500: "#243048",
  navy400: "#2E3D5C",
  teal400: "#00D4A8",
  teal300: "#26E8C0",
  teal200: "#6EFADC",
  teal100: "#ADFCEE",
  amber400: "#F59E0B",
  amber300: "#FBB740",
  red400: "#EF4444",
  red300: "#F87171",
  green400: "#22C55E",
  green300: "#4ADE80",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",
};

export type ThemeColors = {
  bg: string;
  bgCard: string;
  bgCardElevated: string;
  bgInput: string;
  accent: string;
  accentLight: string;
  accentSubtle: string;
  accentBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  success: string;
  successSubtle: string;
  border: string;
  borderLight: string;
  separator: string;
  categoryColors: Record<string, string>;
  categorySubtle: Record<string, string>;
};

const categoryColors: Record<string, string> = {
  Food: "#F97316",
  Transport: "#3B82F6",
  Shopping: "#A855F7",
  Bills: "#EF4444",
  Health: "#22C55E",
  Entertainment: "#EC4899",
  Education: "#06B6D4",
  Misc: "#64748B",
};

const categorySubtle: Record<string, string> = {
  Food: "rgba(249, 115, 22, 0.15)",
  Transport: "rgba(59, 130, 246, 0.15)",
  Shopping: "rgba(168, 85, 247, 0.15)",
  Bills: "rgba(239, 68, 68, 0.15)",
  Health: "rgba(34, 197, 94, 0.15)",
  Entertainment: "rgba(236, 72, 153, 0.15)",
  Education: "rgba(6, 182, 212, 0.15)",
  Misc: "rgba(100, 116, 139, 0.15)",
};

export const DarkColors: ThemeColors = {
  bg: palette.navy900,
  bgCard: palette.navy700,
  bgCardElevated: palette.navy600,
  bgInput: palette.navy800,
  accent: palette.teal400,
  accentLight: palette.teal300,
  accentSubtle: "rgba(0, 212, 168, 0.12)",
  accentBorder: "rgba(0, 212, 168, 0.3)",
  textPrimary: palette.white,
  textSecondary: palette.slate400,
  textTertiary: "rgba(148, 163, 184, 0.6)",
  warning: palette.amber400,
  warningSubtle: "rgba(245, 158, 11, 0.12)",
  danger: palette.red400,
  dangerSubtle: "rgba(239, 68, 68, 0.12)",
  success: palette.green400,
  successSubtle: "rgba(34, 197, 94, 0.12)",
  border: "rgba(255, 255, 255, 0.07)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  separator: "rgba(255, 255, 255, 0.05)",
  categoryColors,
  categorySubtle,
};

export const LightColors: ThemeColors = {
  bg: palette.gray50,
  bgCard: palette.white,
  bgCardElevated: palette.gray100,
  bgInput: palette.gray100,
  accent: "#009B7D",
  accentLight: palette.teal300,
  accentSubtle: "rgba(0, 155, 125, 0.08)",
  accentBorder: "rgba(0, 155, 125, 0.25)",
  textPrimary: palette.gray900,
  textSecondary: palette.gray500,
  textTertiary: "rgba(100, 116, 139, 0.6)",
  warning: "#D97706",
  warningSubtle: "rgba(217, 119, 6, 0.1)",
  danger: palette.red400,
  dangerSubtle: "rgba(239, 68, 68, 0.08)",
  success: palette.green400,
  successSubtle: "rgba(34, 197, 94, 0.08)",
  border: "rgba(0, 0, 0, 0.06)",
  borderLight: "rgba(0, 0, 0, 0.1)",
  separator: "rgba(0, 0, 0, 0.04)",
  categoryColors,
  categorySubtle: {
    Food: "rgba(249, 115, 22, 0.1)",
    Transport: "rgba(59, 130, 246, 0.1)",
    Shopping: "rgba(168, 85, 247, 0.1)",
    Bills: "rgba(239, 68, 68, 0.1)",
    Health: "rgba(34, 197, 94, 0.1)",
    Entertainment: "rgba(236, 72, 153, 0.1)",
    Education: "rgba(6, 182, 212, 0.1)",
    Misc: "rgba(100, 116, 139, 0.1)",
  },
};

export const Colors = DarkColors;

export default Colors;

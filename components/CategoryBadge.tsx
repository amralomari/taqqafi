import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Category, getCategoryIcon } from "@/lib/categoryMapper";

type Props = {
  category: Category;
  size?: "sm" | "md";
};

export function CategoryBadge({ category, size = "md" }: Props) {
  const { colors } = useTheme();
  const color = colors.categoryColors[category] ?? colors.categoryColors.Misc;
  const subtle = colors.categorySubtle[category] ?? colors.categorySubtle.Misc;
  const icon = getCategoryIcon(category);
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: subtle },
        isSmall && styles.containerSmall,
      ]}
    >
      <Ionicons name={icon as any} size={isSmall ? 10 : 12} color={color} />
      <Text
        style={[styles.label, { color }, isSmall && styles.labelSmall]}
        numberOfLines={1}
      >
        {category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    alignSelf: "flex-start",
  },
  containerSmall: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  label: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontSize: 10,
  },
});

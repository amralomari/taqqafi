import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="edit/[id]"
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitle: "Edit Transaction",
            headerStyle: { backgroundColor: colors.bgCard },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontFamily: "DMSans_600SemiBold",
              color: colors.textPrimary,
            },
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="budget-form"
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitle: "Set Budget",
            headerStyle: { backgroundColor: colors.bgCard },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontFamily: "DMSans_600SemiBold",
              color: colors.textPrimary,
            },
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="add-expense"
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitle: "Add Expense",
            headerStyle: { backgroundColor: colors.bgCard },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontFamily: "DMSans_600SemiBold",
              color: colors.textPrimary,
            },
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitle: "Settings",
            headerStyle: { backgroundColor: colors.bgCard },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontFamily: "DMSans_600SemiBold",
              color: colors.textPrimary,
            },
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

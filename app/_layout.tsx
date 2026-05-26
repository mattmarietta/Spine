// app/_layout.tsx
// Root layout — handles auth state and routes users appropriately

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2 }, // 2 min cache
  },
});

export default function RootLayout() {
  const { fetchProfile, setProfile } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Initial session check. Stack is already mounted below, so router.replace
    // has a navigator to dispatch to.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user.id);
          router.replace("/(tabs)/");
        } else {
          router.replace("/(auth)/login");
        }
      })
      .catch((err) => {
        console.error("[auth] getSession failed:", err);
        router.replace("/(auth)/login");
      })
      .finally(() => setAuthChecked(true));

    // Reactive updates for login / logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
        router.replace("/(tabs)/");
      } else {
        setProfile(null);
        router.replace("/(auth)/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
      {!authChecked && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
});

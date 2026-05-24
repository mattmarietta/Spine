// app/_layout.tsx
// Root layout — handles auth state and routes users appropriately

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2 }, // 2 min cache
  },
});

export default function RootLayout() {
  const { fetchProfile, setProfile } = useAuthStore();

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
        router.replace("/(tabs)/");
      } else {
        router.replace("/(auth)/login");
      }
    });

    // Listen for auth changes
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
    </QueryClientProvider>
  );
}

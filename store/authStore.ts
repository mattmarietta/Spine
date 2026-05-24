import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Profile } from "../types";

interface AuthState {
  profile: Profile | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) set({ profile: data, isLoading: false });
    else set({ isLoading: false });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      set({ profile });
    }
  },

  signUp: async (email, password, username, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: displayName } },
    });
    if (error) throw error;
    if (data.user) {
      // Profile auto-created by DB trigger, fetch it
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      set({ profile });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null });
  },
}));

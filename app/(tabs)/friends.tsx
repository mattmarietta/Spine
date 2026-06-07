import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui/Avatar";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/colors";
import { screen } from "../../constants/constants";
import {
  getFriends,
  getMyFriendships,
  searchUsers,
  sendFriendRequest,
} from "../../lib/api/friends";
import { useAuthStore } from "../../store/stores";
import type { FriendRelation, Friendship, Profile } from "../../types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Derives the UI-level relation between the current user and another user.
// Separates "I sent a request" (requested) from "they sent me one" (pending)
// so the button label is always accurate.
function computeRelation(
  otherId: string,
  myId: string,
  friendships: Friendship[],
): FriendRelation {
  const row = friendships.find(
    (f) => f.requester === otherId || f.addressee === otherId,
  );
  if (!row) return "none";
  if (row.status === "accepted") return "accepted";
  if (row.status === "pending") {
    return row.requester === myId ? "requested" : "pending";
  }
  return "blocked";
}

// ─── FriendRow ─────────────────────────────────────────────────────────────────

function FriendRow({ profile }: { profile: Profile }) {
  return (
    <View style={s.friendRow}>
      <Avatar
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
        size={44}
      />
      <View style={s.rowInfo}>
        <Text style={s.rowName}>{profile.display_name}</Text>
        <Text style={s.rowUsername}>@{profile.username}</Text>
      </View>
    </View>
  );
}

// ─── SearchResultRow ──────────────────────────────────────────────────────────

interface SearchResultRowProps {
  profile: Profile;
  relation: FriendRelation;
  onAdd: (id: string) => void;
}

function SearchResultRow({ profile, relation, onAdd }: SearchResultRowProps) {
  const actionLabel: Record<FriendRelation, string> = {
    none: "Add",
    requested: "Sent",
    pending: "Accept",
    accepted: "Friends",
    blocked: "",
  };

  const isActive = relation === "none" || relation === "pending";

  return (
    <View style={s.searchRow}>
      <Avatar
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
        size={44}
      />
      <View style={s.rowInfo}>
        <Text style={s.rowName}>{profile.display_name}</Text>
        <Text style={s.rowUsername}>@{profile.username}</Text>
      </View>
      {relation !== "blocked" && (
        <TouchableOpacity
          style={[s.actionBtn, !isActive && s.actionBtnDone]}
          onPress={() => isActive && onAdd(profile.id)}
          disabled={!isActive}
          activeOpacity={isActive ? 0.7 : 1}
        >
          <Text style={[s.actionBtnText, !isActive && s.actionBtnTextDone]}>
            {actionLabel[relation]}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function FriendsScreen() {
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Optimistic state: IDs we've just sent a request to this session.
  // Avoids waiting for cache invalidation to update the button state.
  const [justRequested, setJustRequested] = useState<Set<string>>(new Set());

  // Debounce: only update the query used by React Query after the user stops typing.
  // 300 ms is long enough to skip mid-word keystrokes, short enough to feel instant.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const closeModal = useCallback(() => {
    Keyboard.dismiss();
    setModalVisible(false);
    setSearchInput("");
    setDebouncedQuery("");
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends", profile?.id],
    queryFn: () => getFriends(profile!.id),
    enabled: !!profile?.id,
  });

  // All of the current user's friendship rows — used to compute button states
  // in search results without firing a separate query per result (avoids N+1).
  const { data: myFriendships = [] } = useQuery({
    queryKey: ["myFriendships", profile?.id],
    queryFn: () => getMyFriendships(),
    enabled: !!profile?.id,
  });

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ["userSearch", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  // Filter self from results — the API is generic and doesn't know the caller.
  const filteredResults = searchResults.filter((u) => u.id !== profile?.id);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const sendRequest = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      // Refresh the friendships cache so future re-opens of the modal are correct.
      queryClient.invalidateQueries({
        queryKey: ["myFriendships", profile?.id],
      });
    },
    onError: (_err, addresseeId) => {
      // Revert the optimistic update so the button goes back to "Add".
      setJustRequested((prev) => {
        const next = new Set(prev);
        next.delete(addresseeId);
        return next;
      });
    },
  });

  const handleAddFriend = useCallback(
    (addresseeId: string) => {
      setJustRequested((prev) => new Set([...prev, addresseeId]));
      sendRequest.mutate(addresseeId);
    },
    [sendRequest],
  );

  // ── Derived state ──────────────────────────────────────────────────────────

  const getRelation = useCallback(
    (userId: string): FriendRelation => {
      // Optimistic override — check local set first before hitting the cache.
      if (justRequested.has(userId)) return "requested";
      return computeRelation(
        userId,
        profile!.id,
        myFriendships as Friendship[],
      );
    },
    [justRequested, myFriendships, profile],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={screen.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={screen.title}>Friends</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setModalVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="person-add-outline"
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Friends list */}
      {loadingFriends ? (
        <ActivityIndicator
          color={COLORS.primary}
          style={{ marginTop: SPACING.xl }}
        />
      ) : friends.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}></Text>
          <Text style={s.emptyTitle}>No friends yet</Text>
          <Text style={s.emptyBody}>
            Find readers and add them to see what they're reading.
          </Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={s.emptyBtnText}>Find friends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(f) => f.id}
          renderItem={({ item }) => <FriendRow profile={item} />}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xl }}
        />
      )}

      {/* ── Add Friend Modal ────────────────────────────────────────────── */}
      {/*
        Uses React Native's built-in Modal — no extra dependency needed.
        animationType="slide" gives the bottom-sheet feel without Animated boilerplate.
        The outer Pressable is the backdrop; the inner Pressable on the sheet
        stops propagation so tapping inside doesn't close the modal.
      */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <Pressable style={s.backdrop} onPress={closeModal}>
          <Pressable style={s.sheet} onPress={() => {}}>
            {/* Drag handle — purely decorative, signals "this is a sheet" */}
            <View style={s.handle} />

            {/* Sheet header */}
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Add Friends</Text>
              <TouchableOpacity
                onPress={closeModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View style={s.searchBox}>
              <Ionicons
                name="search-outline"
                size={18}
                color={COLORS.textMuted}
                style={{ marginRight: SPACING.sm }}
              />
              <TextInput
                style={s.searchInput}
                placeholder="Search by name or @username"
                placeholderTextColor={COLORS.textMuted}
                value={searchInput}
                onChangeText={setSearchInput}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {/* Results area */}
            {searching ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ marginTop: SPACING.xl }}
              />
            ) : debouncedQuery.length < 2 ? (
              <View style={s.hint}>
                <Text style={s.hintText}>
                  Type at least 2 characters to search
                </Text>
              </View>
            ) : filteredResults.length === 0 ? (
              <View style={s.hint}>
                <Text style={s.hintText}>
                  No readers found for "{debouncedQuery}"
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredResults}
                keyExtractor={(u) => u.id}
                renderItem={({ item }) => (
                  <SearchResultRow
                    profile={item}
                    relation={getRelation(item.id)}
                    onAdd={handleAddFriend}
                  />
                )}
                ItemSeparatorComponent={() => <View style={s.separator} />}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: SPACING.xl }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
  },

  // Friend rows (main list)
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  rowInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
  },
  rowUsername: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Georgia",
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal backdrop
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.overlay,
  },

  // Bottom sheet
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.page,
    paddingBottom: SPACING.xl,
    maxHeight: "100%",
    ...SHADOW.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Georgia",
    fontWeight: "500",
    color: COLORS.text,
  },
  closeBtn: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },

  // Search input inside sheet
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },

  // Search result rows
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    minWidth: 64,
    alignItems: "center",
  },
  actionBtnDone: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },
  actionBtnTextDone: {
    color: COLORS.textMuted,
  },

  // Hint / empty search state
  hint: {
    paddingTop: SPACING.xl,
    alignItems: "center",
  },
  hintText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});

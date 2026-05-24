import type { Activity, Friendship, Profile } from "../../types";
import { supabase } from "../supabase";

export async function sendFriendRequest(addresseeId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("friendships")
    .insert({ requester: user.id, addressee: addresseeId });

  if (error) throw error;
}

export async function respondToRequest(
  friendshipId: string,
  accept: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", friendshipId);

  if (error) throw error;
}

export async function getFriends(userId: string): Promise<Profile[]> {
  // Use the friends view to get both directions
  const { data, error } = await supabase
    .from("friendships")
    .select(
      "requester, addressee, requester_profile:profiles!requester(*), addressee_profile:profiles!addressee(*)",
    )
    .eq("status", "accepted")
    .or(`requester.eq.${userId},addressee.eq.${userId}`);

  if (error) throw error;

  return (data ?? []).map((f: any) =>
    f.requester === userId ? f.addressee_profile : f.requester_profile,
  );
}

export async function getPendingRequests(): Promise<Friendship[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select("*, requester_profile:profiles!requester(*)")
    .eq("addressee", user.id)
    .eq("status", "pending");

  if (error) throw error;
  return data ?? [];
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

// ─── Friend Activity Feed ─────────────────────────────────────

export async function getFriendActivity(limit = 30): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("friend_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// ─── Social Recommendations ───────────────────────────────────
// Books your friends loved that you haven't read yet

export async function getFriendRecommendations(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("friend_popular_books")
    .select("*")
    .order("friend_count", { ascending: false })
    .order("avg_friend_rating", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Filter out books already on user's shelf
  const { data: myBooks } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("user_id", userId);

  const myBookIds = new Set((myBooks ?? []).map((b) => b.book_id));
  return (data ?? []).filter((b) => !myBookIds.has(b.book_id));
}

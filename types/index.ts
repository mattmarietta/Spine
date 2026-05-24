// All shared types for application defined here

// ENUMS

export type ShelfStatus = "want" | "reading" | "read" | "did_not_finish";

export type FriendshipStatus = "friends" | "pending" | "requested" | "none";

export type ActivityType =
  | "started_reading"
  | "finished_book"
  | "rated_book"
  | "added_to_shelf"
  | "joined_club"
  | "earned_badge";

export type ClubRole = "owner" | "member" | "admin";

// Database types

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  reading_goal: number;
  xp: number;
  level: number;
  streak_days: number;
  last_read_at: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  open_library_id: string | null;
  google_books_id: string | null;
  isbn: string | null;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  genres: string[];
  page_count: number | null;
  published_year: number | null;
  language: string;
  created_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: ShelfStatus;
  rating: number | null;
  review: string | null;
  progress_page: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  book?: Book;
}

export interface Friendship {
  id: string;
  requester: string;
  addressee: string;
  status: FriendshipStatus;
  created_at: string;
  // Joined
  requester_profile?: Profile;
  addressee_profile?: Profile;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  cover_color: string;
  is_private: boolean;
  invite_code: string;
  current_book_id: string | null;
  next_meeting: string | null;
  created_by: string;
  created_at: string;
  // Joined
  current_book?: Book;
  member_count?: number;
  user_role?: ClubRole;
}

export interface ClubMember {
  club_id: string;
  user_id: string;
  role: ClubRole;
  joined_at: string;
  // Joined
  profile?: Profile;
}

export interface ClubMessage {
  id: string;
  club_id: string;
  user_id: string;
  content: string;
  book_id: string | null;
  chapter: number | null;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  book_id: string | null;
  club_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  // From friend_activity view
  display_name?: string;
  username?: string;
  avatar_url?: string | null;
  book_title?: string;
  book_author?: string;
  book_cover?: string | null;
  rating?: number | null;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// API Types
export interface OpenLibrarySearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  subject?: string[];
  number_of_pages_median?: number;
}

export interface OpenLibraryBook {
  title: string;
  authors?: { author: { key: string } }[];
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
}

// UI and Application Types
export interface RecommendedBook extends Book {
  match_score: number;
  reason: string; // Similar to books you've read, "Because you liked X"
  friend_count?: number; // How many friends have this on their shelves
  avg_friend_rating?: number; // Average rating from friends who have read it
}

export interface ShelfSection {
  title: string;
  books: UserBook[];
  status: ShelfStatus;
}

// Reader level thresholds and experience
export const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500,
] as const;

export function getLevelName(level: number): string {
  const names = [
    "Newcomer",
    "Bookworm",
    "Page Turner",
    "Avid Reader",
    "Bibliophile",
    "Literary Explorer",
    "Scholar",
    "Sage",
    "Archivist",
    "Grand Chronicler",
  ];
  return names[Math.min(level - 1, names.length - 1)] ?? "Legend";
}

export function getXpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] ?? 9999;
}

// All shared types for project defined here

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

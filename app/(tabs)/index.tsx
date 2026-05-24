// app/(tabs)/index.tsx  (Library screen)
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../../constants/colors";
import { screen } from "../../constants/constants";
import { getMyShelf } from "../../lib/api/books";
import { useAuthStore } from "../../store/stores";
import type { UserBook } from "../../types";

// ─── Book Cover ───────────────────────────────────────────────
function BookCover({
  book,
  width = 72,
  height = 104,
}: {
  book: UserBook;
  width?: number;
  height?: number;
}) {
  const colors = [
    "#2D5A41",
    "#1E3A5F",
    "#4A3060",
    "#8B3A2F",
    "#2C5F7A",
    "#5C2D6E",
    "#C45C8A",
    "#3D6B4A",
  ];
  const color = colors[(book.book?.title.length ?? 0) % colors.length];

  return (
    <View style={[styles.cover, { width, height, backgroundColor: color }]}>
      <Text
        style={[styles.coverTitle, { fontSize: width < 60 ? 7 : 9 }]}
        numberOfLines={3}
      >
        {book.book?.title}
      </Text>
      <Text
        style={[styles.coverAuthor, { fontSize: width < 60 ? 6 : 8 }]}
        numberOfLines={1}
      >
        {book.book?.author.split(" ").slice(-1)[0]}
      </Text>
    </View>
  );
}

// ─── Star Rating ──────────────────────────────────────────────
function Stars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={10}
          color={i <= Math.round(rating) ? COLORS.accent : COLORS.border}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function LibraryScreen() {
  const profile = useAuthStore((s) => s.profile);

  const {
    data: shelf = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["shelf", profile?.id],
    queryFn: () => getMyShelf(profile!.id),
    enabled: !!profile?.id,
  });

  const reading = shelf.filter((b) => b.status === "reading");
  const read = shelf.filter((b) => b.status === "read");
  const want = shelf.filter((b) => b.status === "want");

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.title}>My Library</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/search")}
          >
            <Ionicons name="add" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{read.length}</Text>
            <Text style={styles.statLabel}>Books read</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.streak_days ?? 0}</Text>
            <Text style={[styles.statLabel]}>Day streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <Text style={[styles.statNumber, { color: COLORS.background }]}>
              {profile?.reading_goal ?? 12}
            </Text>
            <Text
              style={[styles.statLabel, { color: "rgba(247,242,232,0.7)" }]}
            >
              Goal
            </Text>
          </View>
        </View>

        {/* Currently Reading */}
        <Text style={screen.sectionTitle}>Currently Reading</Text>
        {reading.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={32} color={COLORS.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No books in progress</Text>
            <TouchableOpacity onPress={() => router.push("/search")}>
              <Text style={styles.emptyAction}>Find something to read</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.currentlyReadingList}>
            {reading.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.currentCard}
                onPress={() => router.push(`/book/${b.book_id}`)}
              >
                <BookCover book={b} width={60} height={88} />
                <View style={styles.currentInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {b.book?.title}
                  </Text>
                  <Text style={styles.bookAuthor}>{b.book?.author}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${b.book?.page_count ? Math.round((b.progress_page / b.book.page_count) * 100) : 0}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {b.book?.page_count
                      ? `${Math.round((b.progress_page / b.book.page_count) * 100)}% · p.${b.progress_page} of ${b.book.page_count}`
                      : `Page ${b.progress_page}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Read */}
        {read.length > 0 && (
          <>
            <Text style={screen.sectionTitle}>Read</Text>
            <View style={styles.grid}>
              {read.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.gridCard}
                  onPress={() => router.push(`/book/${b.book_id}`)}
                >
                  <BookCover book={b} width={44} height={62} />
                  <View style={styles.gridInfo}>
                    <Text style={styles.gridTitle} numberOfLines={2}>
                      {b.book?.title}
                    </Text>
                    <Text style={styles.gridAuthor} numberOfLines={1}>
                      {b.book?.author.split(" ").slice(-1)[0]}
                    </Text>
                    <Stars rating={b.rating} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Want to Read */}
        {want.length > 0 && (
          <>
            <Text style={screen.sectionTitle}>Want to Read</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.wantRow}
            >
              {want.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.wantItem}
                  onPress={() => router.push(`/book/${b.book_id}`)}
                >
                  <BookCover book={b} width={72} height={104} />
                  <Text style={styles.wantTitle} numberOfLines={2}>
                    {b.book?.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Empty state for brand new users */}
        {shelf.length === 0 && (
          <View style={styles.bigEmpty}>
            <Ionicons name="library-outline" size={56} color={COLORS.textMuted} style={styles.bigEmptyIcon} />
            <Text style={styles.bigEmptyTitle}>Your shelf is empty</Text>
            <Text style={styles.bigEmptySubtitle}>
              Search for a book to get started
            </Text>
            <TouchableOpacity
              style={styles.bigEmptyButton}
              onPress={() => router.push("/search")}
            >
              <Text style={styles.bigEmptyButtonText}>
                Add your first book
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  scroll: { paddingHorizontal: SPACING.page, paddingBottom: 32 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontFamily: "Georgia",
    color: COLORS.text,
    fontWeight: "500",
  },
  addButton: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    padding: 7,
  },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: "center",
  },
  statNumber: { fontSize: 20, fontWeight: "600", color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 24,
  },
  emptyIcon: { marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },
  emptyAction: { fontSize: 13, color: COLORS.primary, fontWeight: "500" },

  currentlyReadingList: { gap: 10, marginBottom: 28 },
  currentCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  currentInfo: { flex: 1 },
  bookTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 2,
  },
  bookAuthor: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 5,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: { fontSize: 11, color: COLORS.textSecondary },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  gridCard: {
    flexDirection: "row",
    gap: 8,
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  gridInfo: { flex: 1 },
  gridTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.text,
    lineHeight: 15,
    marginBottom: 2,
  },
  gridAuthor: { fontSize: 10, color: COLORS.textMuted, marginBottom: 4 },
  stars: { flexDirection: "row", gap: 1 },

  wantRow: { marginBottom: 28 },
  wantItem: { marginRight: 12, alignItems: "center", width: 72 },
  wantTitle: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 13,
  },

  cover: {
    borderRadius: 3,
    justifyContent: "flex-end",
    padding: 6,
    overflow: "hidden",
  },
  coverTitle: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "500",
    lineHeight: 12,
  },
  coverAuthor: { color: "rgba(255,255,255,0.6)", marginTop: 2 },

  bigEmpty: { alignItems: "center", paddingVertical: 60 },
  bigEmptyIcon: { marginBottom: 16 },
  bigEmptyTitle: {
    fontSize: 20,
    fontFamily: "Georgia",
    color: COLORS.text,
    marginBottom: 8,
  },
  bigEmptySubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 28 },
  bigEmptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  bigEmptyButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: "500",
  },
});

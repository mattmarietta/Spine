import { Ionicons } from "@expo/vector-icons";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/colors";
import { addToShelf, getMyShelf, updateShelfEntry } from "../../lib/api/books";
import { useAuthStore } from "../../store/stores";
import type { Book, ShelfStatus } from "../../types";

const COVER_COLORS = [
  "#2D5A41",
  "#1E3A5F",
  "#4A3060",
  "#8B3A2F",
  "#2C5F7A",
  "#5C2D6E",
  "#3D6B4A",
  "#7A4A2E",
];

const STATUS_OPTIONS: { value: ShelfStatus; label: string; icon: string }[] = [
  { value: "want", label: "Want to Read", icon: "bookmark-outline" },
  { value: "reading", label: "Currently Reading", icon: "book-outline" },
  { value: "read", label: "Finished", icon: "checkmark-circle-outline" },
];

function LargeCover({ title, coverUrl }: { title: string; coverUrl: string }) {
  const [imgError, setImgError] = useState(false);
  const color = COVER_COLORS[title.length % COVER_COLORS.length];

  if (coverUrl && !imgError) {
    return (
      <Image
        source={{ uri: coverUrl }}
        style={styles.coverImage}
        onError={() => setImgError(true)}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.coverFallback, { backgroundColor: color }]}>
      <Text style={styles.coverFallbackTitle} numberOfLines={4}>
        {title}
      </Text>
    </View>
  );
}

function GenrePill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

export default function BookDetailScreen() {
  const { id, title, author, cover_url, genres, page_count, published_year, description, isbn, userBookId: paramUserBookId, status: paramStatus } =
    useLocalSearchParams<{
      id: string;
      title: string;
      author: string;
      cover_url: string;
      genres: string;
      page_count: string;
      published_year: string;
      description: string;
      isbn: string;
      userBookId?: string;
      status?: ShelfStatus;
    }>();

  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const parsedGenres: string[] = (() => {
    try {
      return JSON.parse(genres || "[]");
    } catch {
      return [];
    }
  })();

  const pageCountNum = page_count ? parseInt(page_count, 10) : null;
  const publishedYearNum = published_year ? parseInt(published_year, 10) : null;

  // Reconstruct the Book object from params for addToShelf
  const bookFromParams: Omit<Book, "id" | "created_at"> = {
    open_library_id: id,
    google_books_id: null,
    isbn: isbn || null,
    title: title ?? "",
    author: author ?? "",
    description: description || null,
    cover_url: cover_url || null,
    genres: parsedGenres,
    page_count: isNaN(pageCountNum!) ? null : pageCountNum,
    published_year: isNaN(publishedYearNum!) ? null : publishedYearNum,
    language: "en",
  };

  // Pull shelf from cache — same query key the library uses
  const { data: shelf = [] } = useQuery({
    queryKey: ["shelf", profile?.id],
    queryFn: () => getMyShelf(profile!.id),
    enabled: !!profile?.id,
  });

  // Find existing shelf entry by open_library_id
  const shelfEntry = shelf.find((ub) => ub.book?.open_library_id === id);
  const currentUserBookId = shelfEntry?.id ?? paramUserBookId;
  const currentStatus = shelfEntry?.status ?? paramStatus ?? null;

  const invalidateShelf = () =>
    queryClient.invalidateQueries({ queryKey: ["shelf", profile?.id] });

  const addMutation = useMutation({
    mutationFn: (status: ShelfStatus) =>
      addToShelf(profile!.id, bookFromParams as Book, status),
    onSuccess: () => {
      invalidateShelf();
      setShowStatusPicker(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (status: ShelfStatus) =>
      updateShelfEntry(currentUserBookId!, { status }),
    onSuccess: () => {
      invalidateShelf();
      setShowStatusPicker(false);
    },
  });

  const isPending = addMutation.isPending || updateMutation.isPending;

  function handleStatusSelect(status: ShelfStatus) {
    if (currentUserBookId) {
      updateMutation.mutate(status);
    } else {
      addMutation.mutate(status);
    }
  }

  const activeStatusOption = STATUS_OPTIONS.find((o) => o.value === currentStatus);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Cover + title block */}
        <View style={styles.heroSection}>
          <View style={styles.coverWrapper}>
            <LargeCover title={title ?? ""} coverUrl={cover_url ?? ""} />
          </View>
          <Text style={styles.bookTitle}>{title}</Text>
          <Text style={styles.bookAuthor}>{author}</Text>
          <View style={styles.metaRow}>
            {publishedYearNum ? (
              <Text style={styles.metaBadge}>{publishedYearNum}</Text>
            ) : null}
            {pageCountNum ? (
              <Text style={styles.metaBadge}>{pageCountNum} pages</Text>
            ) : null}
          </View>
        </View>

        {/* Shelf action */}
        <View style={styles.shelfSection}>
          {currentStatus && !showStatusPicker ? (
            // Already on shelf — show status with change option
            <View style={styles.onShelfRow}>
              <View style={styles.onShelfBadge}>
                <Ionicons
                  name={activeStatusOption?.icon as any ?? "bookmark"}
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.onShelfLabel}>
                  {activeStatusOption?.label ?? currentStatus}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowStatusPicker(true)}
                style={styles.changeBtn}
              >
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : !showStatusPicker ? (
            // Not on shelf — primary CTA
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowStatusPicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={COLORS.background} />
              <Text style={styles.addBtnText}>Add to Shelf</Text>
            </TouchableOpacity>
          ) : null}

          {/* Status picker */}
          {showStatusPicker && (
            <View style={styles.statusPicker}>
              <Text style={styles.statusPickerLabel}>Add to shelf as…</Text>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.statusOption,
                    currentStatus === opt.value && styles.statusOptionActive,
                  ]}
                  onPress={() => handleStatusSelect(opt.value)}
                  disabled={isPending}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={18}
                    color={
                      currentStatus === opt.value
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      currentStatus === opt.value && styles.statusOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isPending && currentStatus !== opt.value ? null : isPending ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : currentStatus === opt.value ? (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setShowStatusPicker(false)}
                style={styles.cancelPickerBtn}
              >
                <Text style={styles.cancelPickerText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Subjects / genres */}
        {parsedGenres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <View style={styles.pillRow}>
              {parsedGenres.map((g) => (
                <GenrePill key={g} label={g} />
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        ) : null}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            {isbn ? <DetailRow label="ISBN" value={isbn} /> : null}
            {publishedYearNum ? (
              <DetailRow label="Published" value={String(publishedYearNum)} />
            ) : null}
            {pageCountNum ? (
              <DetailRow label="Pages" value={String(pageCountNum)} />
            ) : null}
            <DetailRow label="Source" value="Open Library" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.page, paddingBottom: 48 },

  backBtn: { paddingTop: 8, paddingBottom: 4, alignSelf: "flex-start" },

  heroSection: { alignItems: "center", paddingTop: 8, paddingBottom: 24 },
  coverWrapper: {
    ...SHADOW.md,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
  },
  coverImage: { width: 140, height: 210, borderRadius: 8 },
  coverFallback: {
    width: 140,
    height: 210,
    borderRadius: 8,
    justifyContent: "flex-end",
    padding: 12,
  },
  coverFallbackTitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
  },
  bookTitle: {
    fontSize: 22,
    fontFamily: "Georgia",
    fontWeight: "500",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 30,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  bookAuthor: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 10,
  },
  metaRow: { flexDirection: "row", gap: 8 },
  metaBadge: {
    fontSize: 11,
    color: COLORS.textMuted,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },

  shelfSection: { marginBottom: 24 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    gap: 6,
  },
  addBtnText: { fontSize: 15, fontWeight: "600", color: COLORS.background },

  onShelfRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  onShelfBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
  onShelfLabel: { fontSize: 14, fontWeight: "500", color: COLORS.primary },
  changeBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  changeBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },

  statusPicker: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  statusPickerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight,
  },
  statusOptionActive: { backgroundColor: COLORS.primaryMuted },
  statusOptionText: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  statusOptionTextActive: { color: COLORS.primary, fontWeight: "500" },
  cancelPickerBtn: {
    alignItems: "center",
    paddingVertical: 13,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  cancelPickerText: { fontSize: 14, color: COLORS.textMuted },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },

  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight,
  },
  detailLabel: { fontSize: 13, color: COLORS.textMuted },
  detailValue: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
});

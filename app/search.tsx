import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../constants/colors";
import { searchBooks } from "../lib/api/books";
import type { Book } from "../types";

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

function MiniCover({ title, coverUrl, width = 52, height = 76 }: { title: string; coverUrl?: string | null; width?: number; height?: number }) {
  const [imgError, setImgError] = useState(false);
  const color = COVER_COLORS[title.length % COVER_COLORS.length];

  if (coverUrl && !imgError) {
    return (
      <Image
        source={{ uri: coverUrl }}
        style={[styles.cover, { width, height }]}
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View style={[styles.cover, { width, height, backgroundColor: color }]}>
      <Text style={styles.coverTitle} numberOfLines={3}>
        {title}
      </Text>
    </View>
  );
}

function GenrePill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const books = await searchBooks(query.trim());
        setResults(books);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleBookPress(book: Book) {
    if (!book.open_library_id) return;
    router.push({
      pathname: `/book/${book.open_library_id}`,
      params: {
        title: book.title,
        author: book.author,
        cover_url: book.cover_url ?? "",
        genres: JSON.stringify(book.genres),
        page_count: String(book.page_count ?? ""),
        published_year: String(book.published_year ?? ""),
        description: book.description ?? "",
        isbn: book.isbn ?? "",
      },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors…"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {isSearching && (
            <ActivityIndicator size="small" color={COLORS.textMuted} style={styles.searchSpinner} />
          )}
        </View>
      </View>

      {/* Results */}
      {!hasSearched && !isSearching && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Search for a book</Text>
          <Text style={styles.emptySubtitle}>
            Title, author, or ISBN — we search Open Library
          </Text>
        </View>
      )}

      {hasSearched && results.length === 0 && !isSearching && (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try a different title or author</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.open_library_id ?? item.title}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultRow}
            onPress={() => handleBookPress(item)}
            activeOpacity={0.7}
          >
            <MiniCover title={item.title} coverUrl={item.cover_url} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.resultAuthor} numberOfLines={1}>
                {item.author}
              </Text>
              {item.published_year && (
                <Text style={styles.resultMeta}>{item.published_year}</Text>
              )}
              {item.genres.length > 0 && (
                <View style={styles.pillRow}>
                  {item.genres.slice(0, 3).map((g) => (
                    <GenrePill key={g} label={g} />
                  ))}
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.page,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  searchSpinner: { marginLeft: 6 },

  list: {
    paddingHorizontal: SPACING.page,
    paddingBottom: 32,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: 52 + 12,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  resultInfo: { flex: 1 },
  resultTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 2,
  },
  resultAuthor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  pill: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "500",
  },

  cover: {
    borderRadius: 4,
    justifyContent: "flex-end",
    padding: 5,
    overflow: "hidden",
  },
  coverTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 8,
    fontWeight: "500",
    lineHeight: 11,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Georgia",
    color: COLORS.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

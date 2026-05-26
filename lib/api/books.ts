// File for searching books in the database using API calls

// Import supabase and types for books and user books
import type {
    Book,
    OpenLibrarySearchResult,
    ShelfStatus,
    UserBook,
} from "../../types";
import { supabase } from "../supabase";

const OL_SEARCH = "https://openlibrary.org/search.json";
const OL_COVER = "https://covers.openlibrary.org/b/id";

// Function to search for books on a query
export async function searchBooks(query: string, limit = 20): Promise<Book[]> {
  const res = await fetch(
    `${OL_SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year,isbn,subject,number_of_pages_median`,
  );
  const data = await res.json();

  return (data.docs as OpenLibrarySearchResult[]).map((doc) => ({
    id: "", // Not in DB yet
    open_library_id: doc.key.replace("/works/", ""),
    google_books_id: null,
    isbn: doc.isbn?.[0] ?? null,
    title: doc.title,
    author: doc.author_name?.[0] ?? "Unknown Author",
    description: null,
    cover_url: doc.cover_i ? `${OL_COVER}/${doc.cover_i}-M.jpg` : null,
    genres: doc.subject?.slice(0, 4) ?? [],
    page_count: doc.number_of_pages_median ?? null,
    published_year: doc.first_publish_year ?? null,
    language: "en",
    created_at: new Date().toISOString(),
  }));
}

// Add book to database on the first interaction

export async function upsertBook(
  book: Omit<Book, "id" | "created_at">,
): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .upsert(book, { onConflict: "open_library_id", ignoreDuplicates: false })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function getMyShelf(userId: string): Promise<UserBook[]> {
  const { data, error } = await supabase
    .from("user_books")
    .select("*, book:books(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function addToShelf(
  userId: string,
  book: Omit<Book, "id" | "created_at">,
  status: ShelfStatus = "want",
): Promise<UserBook> {
  // First upsert the book to ensure it exists in the database
  const savedBook = await upsertBook(book);

  const { data, error } = await supabase
    .from("user_books")
    .upsert(
      { user_id: userId, book_id: savedBook.id, status },
      { onConflict: "user_id,book_id" },
    )
    .select("*, book:books(*)")
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("activities").insert({
    user_id: userId,
    type: status === "reading" ? "started_reading" : "added_to_shelf",
    book_id: savedBook.id,
  });

  return data;
}

export async function updateShelfEntry(
  userBookId: string,
  updates: Partial<
    Pick<UserBook, "status" | "rating" | "review" | "progress_page">
  >,
): Promise<UserBook> {
  // Auto-set timestamps
  const payload: any = { ...updates };
  if (updates.status === "reading" && !payload.started_at) {
    payload.started_at = new Date().toISOString();
  }
  if (updates.status === "read" && !payload.finished_at) {
    payload.finished_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("user_books")
    .update(payload)
    .eq("id", userBookId)
    .select("*, book:books(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function rateBook(
  userId: string,
  bookId: string,
  rating: number,
  review?: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_books")
    .update({
      rating,
      review,
      status: "read",
      finished_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (error) throw error;

  await supabase.from("activities").insert({
    user_id: userId,
    type: "rated_book",
    book_id: bookId,
    metadata: { rating },
  });
}

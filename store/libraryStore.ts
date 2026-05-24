// Local cache of the user's shelf for instant UI updates
import { create } from "zustand";
import type { ShelfStatus, UserBook } from "../types";

interface LibraryState {
  books: UserBook[];
  isLoaded: boolean;
  setBooks: (books: UserBook[]) => void;
  addBook: (book: UserBook) => void;
  updateBook: (id: string, updates: Partial<UserBook>) => void;
  getByStatus: (status: ShelfStatus) => UserBook[];
  getByBookId: (bookId: string) => UserBook | undefined;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  isLoaded: false,

  setBooks: (books) => set({ books, isLoaded: true }),

  addBook: (book) =>
    set((state) => ({
      books: [book, ...state.books.filter((b) => b.id !== book.id)],
    })),

  updateBook: (id, updates) =>
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  getByStatus: (status) => get().books.filter((b) => b.status === status),

  getByBookId: (bookId) => get().books.find((b) => b.book_id === bookId),
}));

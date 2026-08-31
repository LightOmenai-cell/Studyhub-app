"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Book {
  id: string;
  title: string;
  authors?: string[];
  description?: string;
  thumbnail?: string;
  previewLink?: string;
  pdfDownloadLink?: string;
  epubDownloadLink?: string;
  epubSource?: "google" | "gutenberg";
  source: "google" | "openlibrary";
}

export default function BooksPage() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  async function logHistory(entry: {
    action_type: "search" | "view";
    search_query?: string;
    book_title?: string;
    book_authors?: string;
    thumbnail_url?: string;
  }) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("book_history").insert({
        user_id: user.id,
        action_type: entry.action_type,
        search_query: entry.search_query || null,
        book_title: entry.book_title || null,
        book_authors: entry.book_authors || null,
        thumbnail_url: entry.thumbnail_url || null,
      });
    } catch (err) {
      console.error("Failed to log book history:", err);
    }
  }

  // Checks Project Gutenberg (Gutendex) for a free EPUB when nothing else has one.
  // Fails silently if Gutenberg is slow/unavailable — never blocks the search.
  async function checkGutenbergFallback(book: Book) {
    try {
      const res = await fetch(
        `https://gutendex.com/books?search=${encodeURIComponent(book.title)}`
      );
      const data = await res.json();
      const match = data.results?.[0];
      const epubLink = match?.formats?.["application/epub+zip"];
      if (epubLink) {
        setBooks((prev) =>
          prev.map((b) =>
            b.id === book.id
              ? { ...b, epubDownloadLink: epubLink, epubSource: "gutenberg" }
              : b
          )
        );
      }
    } catch (err) {
      // Gutenberg unreachable or no match — leave as-is, no error shown
    }
  }

  async function fetchGoogleResults(searchTerm: string): Promise<Book[]> {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        searchTerm
      )}&maxResults=40&key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`
    );
    const data = await res.json();
    return (data.items || []).map((item: any) => {
      const pdfAvailable = item.accessInfo?.pdf?.isAvailable;
      const epubAvailable = item.accessInfo?.epub?.isAvailable;

      return {
        id: `google-${item.id}`,
        title: item.volumeInfo?.title || "Untitled",
        authors: item.volumeInfo?.authors,
        description: item.volumeInfo?.description,
        thumbnail: item.volumeInfo?.imageLinks?.thumbnail,
        previewLink: item.volumeInfo?.previewLink || item.volumeInfo?.infoLink,
        pdfDownloadLink: pdfAvailable
          ? item.accessInfo?.pdf?.downloadLink
          : undefined,
        epubDownloadLink: epubAvailable
          ? item.accessInfo?.epub?.downloadLink
          : undefined,
        epubSource: epubAvailable ? "google" : undefined,
        source: "google",
      };
    });
  }

  async function fetchOpenLibraryResults(searchTerm: string): Promise<Book[]> {
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          searchTerm
        )}&limit=20&fields=key,title,author_name,cover_i`
      );
      const data = await res.json();
      return (data.docs || []).map((doc: any) => ({
        id: `ol-${doc.key}`,
        title: doc.title || "Untitled",
        authors: doc.author_name,
        thumbnail: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        previewLink: `https://openlibrary.org${doc.key}`,
        source: "openlibrary",
      }));
    } catch (err) {
      // Open Library unreachable — just skip it, Google results still show
      return [];
    }
  }

  async function searchBooks(searchTerm: string) {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const [googleResults, openLibraryResults] = await Promise.all([
        fetchGoogleResults(searchTerm),
        fetchOpenLibraryResults(searchTerm),
      ]);

      // Skip Open Library entries that are clearly the same book Google already found
      const googleTitles = new Set(
        googleResults.map((b) => b.title.trim().toLowerCase())
      );
      const uniqueOpenLibrary = openLibraryResults.filter(
        (b) => !googleTitles.has(b.title.trim().toLowerCase())
      );

      const results = [...googleResults, ...uniqueOpenLibrary];
      setBooks(results);

      logHistory({ action_type: "search", search_query: searchTerm });

      // Background check: for any book with no download at all, ask Gutenberg
      results
        .filter((b) => !b.pdfDownloadLink && !b.epubDownloadLink)
        .forEach((b) => checkGutenbergFallback(b));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handleBookOpen(book: Book) {
    logHistory({
      action_type: "view",
      book_title: book.title,
      book_authors: book.authors ? book.authors.join(", ") : undefined,
      thumbnail_url: book.thumbnail,
    });
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Browse Books</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search for a book or subject..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchBooks(query)}
          className="border rounded-lg px-4 py-3 flex-1"
        />
        <button
          onClick={() => searchBooks(query)}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["Physics", "Chemistry", "Biology", "Mathematics", "English"].map(
          (s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                searchBooks(s);
              }}
              className="border rounded-full px-3 py-1 text-sm"
            >
              {s}
            </button>
          )
        )}
      </div>

      {loading && <p>Searching...</p>}
      {!loading && books.length === 0 && query && (
        <p className="text-gray-500 text-sm">
          No results found. Try a different search term.
        </p>
      )}

      <div className="grid gap-4">
        {books.map((book) => {
          const hasDownload = book.pdfDownloadLink || book.epubDownloadLink;

          return (
            <div key={book.id} className="border rounded-lg p-4 flex gap-4">
              {book.thumbnail && (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="w-20 h-28 object-cover rounded"
                />
              )}
              <div>
                <h2 className="font-semibold">{book.title}</h2>
                {book.authors && (
                  <p className="text-sm text-gray-600">
                    {book.authors.join(", ")}
                  </p>
                )}
                {book.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {book.description}
                  </p>
                )}

                {hasDownload ? (
                  <div className="flex gap-3 mt-2 items-center">
                    {book.pdfDownloadLink && (
                      <a
                        href={book.pdfDownloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleBookOpen(book)}
                        className="text-green-700 text-sm font-medium"
                      >
                        ⬇ Download PDF
                      </a>
                    )}
                    {book.epubDownloadLink && (
                      <a
                        href={book.epubDownloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleBookOpen(book)}
                        className="text-purple-700 text-sm font-medium"
                      >
                        ⬇ Download EPUB
                      </a>
                    )}
                    {book.epubSource === "gutenberg" && (
                      <span className="text-xs text-gray-400">
                        via Project Gutenberg
                      </span>
                    )}
                  </div>
                ) : (
                  book.previewLink && (
                    <div className="mt-2">
                      <a
                        href={book.previewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleBookOpen(book)}
                        className="text-blue-600 text-sm inline-block"
                      >
                        {book.source === "openlibrary"
                          ? "View on Open Library"
                          : "Preview / Read"}
                      </a>
                      <span className="text-xs text-gray-400 block mt-0.5">
                        Preview only — PDF/EPUB download not available for this book
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
        }

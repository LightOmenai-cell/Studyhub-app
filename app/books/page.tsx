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

  async function searchBooks(searchTerm: string) {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          searchTerm
        )}&maxResults=40`
      );
      const data = await res.json();
      const results: Book[] = (data.items || []).map((item: any) => {
        const pdfAvailable = item.accessInfo?.pdf?.isAvailable;
        const epubAvailable = item.accessInfo?.epub?.isAvailable;

        return {
          id: item.id,
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
        };
      });
      setBooks(results);

      logHistory({ action_type: "search", search_query: searchTerm });
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
                  <div className="flex gap-3 mt-2">
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
                        Preview / Read
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

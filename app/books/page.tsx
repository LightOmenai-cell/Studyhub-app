            "use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Book {
  id: string;
  title: string;
  authors?: string[];
  description?: string;
  thumbnail?: string;
  link?: string;
}

export default function BooksPage() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  async function searchBooks(searchTerm: string) {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          searchTerm
        )}`
      );
      const data = await res.json();
      const results: Book[] = (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.volumeInfo?.title || "Untitled",
        authors: item.volumeInfo?.authors,
        description: item.volumeInfo?.description,
        thumbnail: item.volumeInfo?.imageLinks?.thumbnail,
        link: item.volumeInfo?.previewLink || item.volumeInfo?.infoLink,
      }));
      setBooks(results);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function logBookView(book: Book) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("book_history").insert({
        user_id: user.id,
        book_title: book.title,
        book_authors: book.authors ? book.authors.join(", ") : null,
        thumbnail_url: book.thumbnail || null,
      });
    } catch (err) {
      console.error("Failed to log book view:", err);
    }
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

      <div className="grid gap-4">
        {books.map((book) => (
          <div
            key={book.id}
            className="border rounded-lg p-4 flex gap-4"
          >
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
              {book.link && (
                <a
                  href={book.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => logBookView(book)}
                  className="text-blue-600 text-sm mt-1 inline-block"
                >
                  Preview / Read
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
              }

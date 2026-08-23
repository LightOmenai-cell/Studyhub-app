import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyHub",
  description: "Study notes, books, and past questions for every level",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

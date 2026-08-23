export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to StudyHub</h1>
      <p className="text-gray-600 mb-8">
        Study notes, books, and past questions for every level.
      </p>
      <a
        href="/login"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
      >
        Get Started
      </a>
    </main>
  );
}

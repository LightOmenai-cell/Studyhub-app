"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS = [
  "mathematics", "english", "physics", "chemistry",
  "biology", "economics", "government", "literature",
];

const EXAM_TYPES = ["utme", "wassce", "post-utme", "neco"];

export default function PastQuestionsPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("mathematics");
  const [examType, setExamType] = useState("utme");
  const [year, setYear] = useState("2020");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchQuestions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://questions.aloc.com.ng/api/v2/q/20?subject=${subject}&type=${examType}&year=${year}`,
        { headers: { "AccessToken": process.env.NEXT_PUBLIC_ALOC_TOKEN || "" } }
      );
      const data = await res.json();
      if (data.data) {
        const questions = Array.isArray(data.data) ? data.data : [data.data];
        sessionStorage.setItem("quizQuestions", JSON.stringify(questions));
        sessionStorage.setItem("quizSubject", subject);
        sessionStorage.setItem("quizExamType", examType);
        sessionStorage.setItem("quizYear", year);
        router.push("/past-questions/quiz");
      } else {
        setError("DEBUG: " + JSON.stringify(data));
      }
    } catch (err) {
      setError("DEBUG CATCH: " + String(err));
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Past Questions</h1>
      <div className="flex flex-col gap-3 mb-6">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border rounded-lg px-4 py-3">
          {SUBJECTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={examType} onChange={(e) => setExamType(e.target.value)} className="border rounded-lg px-4 py-3">
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year e.g. 2020" className="border rounded-lg px-4 py-3" />
        <button onClick={fetchQuestions} disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-3 font-medium">
          {loading ? "Loading..." : "Get Questions"}
        </button>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
    </main>
  );
}

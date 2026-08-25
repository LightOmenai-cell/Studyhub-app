    "use client";

import { useState } from "react";

interface Question {
  id: number;
  question: string;
  option: { a?: string; b?: string; c?: string; d?: string };
  answer?: string;
  section?: string;
}

const SUBJECTS = [
  "mathematics",
  "english",
  "physics",
  "chemistry",
  "biology",
  "economics",
  "government",
  "literature",
];

const EXAM_TYPES = ["utme", "wassce", "post-utme", "neco"];

export default function PastQuestionsPage() {
  const [subject, setSubject] = useState("mathematics");
  const [examType, setExamType] = useState("utme");
  const [year, setYear] = useState("2020");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});

  async function fetchQuestions() {
    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrent(0);
    setSelected({});

    try {
      const res = await fetch(
        `https://questions.aloc.com.ng/api/v2/q/20?subject=${subject}&type=${examType}&year=${year}`,
        {
          headers: {
            "AccessToken": process.env.NEXT_PUBLIC_ALOC_TOKEN || "",
          },
        }
      );
      const data = await res.json();

      if (data.data) {
        setQuestions(Array.isArray(data.data) ? data.data : [data.data]);
      } else {
        setError("DEBUG: " + JSON.stringify(data));
      }
    } catch (err) {
      setError("DEBUG CATCH: " + String(err));
    }
    setLoading(false);
  }

  function selectAnswer(qId: number, option: string) {
    setSelected((prev) => ({ ...prev, [qId]: option }));
  }

  const q = questions[current];

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Past Questions</h1>

      <div className="flex flex-col gap-3 mb-6">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          {EXAM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year e.g. 2020"
          className="border rounded-lg px-4 py-3"
        />

        <button
          onClick={fetchQuestions}
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-4 py-3 font-medium"
        >
          {loading ? "Loading..." : "Get Questions"}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {q && (
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-2">
            Question {current + 1} of {questions.length}
          </p>
        <p className="font-medium mb-4" dangerouslySetInnerHTML={{ __html: q.question }} />
          <div className="flex flex-col gap-2">
            {Object.entries(q.option || {}).map(([key, value]) =>
              value ? (
                <button
                  key={key}
                  onClick={() => selectAnswer(q.id, key)}
                  className={`border rounded-lg px-4 py-3 text-left ${
                    selected[q.id] === key ? "border-blue-600 bg-blue-50" : ""
                  }`}
                >{key.toUpperCase()}. <span dangerouslySetInnerHTML={{ __html: value }} />
                </button>
              ) : null
            )}
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="text-blue-600"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrent((c) => Math.min(questions.length - 1, c + 1))
              }
              disabled={current === questions.length - 1}
              className="text-blue-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
          }    

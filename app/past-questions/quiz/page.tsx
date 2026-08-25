"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  question: string;
  option: { a?: string; b?: string; c?: string; d?: string };
  answer?: string;
  section?: string;
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});

  useEffect(() => {
    const stored = sessionStorage.getItem("quizQuestions");
    if (stored) {
      setQuestions(JSON.parse(stored));
    } else {
      router.push("/past-questions");
    }
  }, [router]);

  function selectAnswer(qId: number, option: string) {
    setSelected((prev) => ({ ...prev, [qId]: option }));
  }

  function handleSubmit() {
    sessionStorage.setItem("quizAnswers", JSON.stringify(selected));
    router.push("/past-questions/results");
  }

  const q = questions[current];

  if (!q) {
    return (
      <main className="min-h-screen p-6">
        <p>Loading questions...</p>
      </main>
    );
  }

  const isLast = current === questions.length - 1;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Past Questions</h1>

      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-2">
          Question {current + 1} of {questions.length}
        </p>
        <p
          className="font-medium mb-4"
          dangerouslySetInnerHTML={{ __html: q.question }}
        />
        <div className="flex flex-col gap-2">
          {Object.entries(q.option || {}).map(([key, value]) =>
            value ? (
              <button
                key={key}
                onClick={() => selectAnswer(q.id, key)}
                className={`border rounded-lg px-4 py-3 text-left ${
                  selected[q.id] === key ? "border-blue-600 bg-blue-50" : ""
                }`}
              >
                {key.toUpperCase()}.{" "}
                <span dangerouslySetInnerHTML={{ __html: value }} />
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

          {isLast ? (
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white rounded-lg px-4 py-2 font-medium"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              className="text-blue-600"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

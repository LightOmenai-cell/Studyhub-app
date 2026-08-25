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

export default function ResultsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    const storedQ = sessionStorage.getItem("quizQuestions");
    const storedA = sessionStorage.getItem("quizAnswers");
    if (storedQ && storedA) {
      setQuestions(JSON.parse(storedQ));
      setAnswers(JSON.parse(storedA));
    } else {
      router.push("/past-questions");
    }
  }, [router]);

  if (questions.length === 0) {
    return (
      <main className="min-h-screen p-6">
        <p>Loading results...</p>
      </main>
    );
  }

  const totalQuestions = questions.length;
  const totalFilled = Object.keys(answers).length;
  const totalCorrect = questions.filter(
    (q) => answers[q.id] && q.answer && answers[q.id] === q.answer
  ).length;

  function tryAgain() {
    sessionStorage.removeItem("quizQuestions");
    sessionStorage.removeItem("quizAnswers");
    router.push("/past-questions");
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Your Results</h1>

      <div className="border rounded-lg p-6 mb-6 text-center">
        <p className="text-4xl font-bold text-blue-600 mb-2">
          {totalCorrect} / {totalQuestions}
        </p>
        <p className="text-gray-500">Correct Answers</p>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <div className="flex justify-between py-2">
          <span>Questions Answered</span>
          <span className="font-medium">
            {totalFilled} / {totalQuestions}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span>Left Unanswered</span>
          <span className="font-medium">
            {totalQuestions - totalFilled}
          </span>
        </div>
      </div>

      <div className="mb-6">
        {questions.map((q, i) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer && q.answer && userAnswer === q.answer;
          return (
            <div key={q.id} className="border rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-500 mb-1">Question {i + 1}</p>
              <p
                className="font-medium mb-2"
                dangerouslySetInnerHTML={{ __html: q.question }}
              />
              <p className="text-sm">
                Your answer:{" "}
                <span
                  className={
                    userAnswer
                      ? isCorrect
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                      : "text-gray-400"
                  }
                >
                  {userAnswer ? userAnswer.toUpperCase() : "Not answered"}
                </span>
              </p>
              {q.answer && (
                <p className="text-sm text-gray-600">
                  Correct answer: {q.answer.toUpperCase()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={tryAgain}
        className="bg-blue-600 text-white rounded-lg px-4 py-3 font-medium w-full"
      >
        Try Another Set
      </button>
    </main>
  );
      }

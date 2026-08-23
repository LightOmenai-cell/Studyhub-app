"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LEVELS = [
  { category: "Primary", options: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"] },
  { category: "Junior Secondary", options: ["JSS1", "JSS2", "JSS3"] },
  { category: "Senior Secondary", options: ["SS1", "SS2", "SS3"] },
  { category: "Tertiary", options: ["Tertiary"] },
];

const DEPARTMENTS = ["Science", "Arts", "Commercial"];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isSenior = level.startsWith("SS");
  const isTertiary = level === "Tertiary";
  const needsStep2 = isSenior || isTertiary;

  function selectLevel(l: string) {
    setLevel(l);
    setStep(needsStepAfter(l) ? 2 : 3);
  }

  function needsStepAfter(l: string) {
    return l.startsWith("SS") || l === "Tertiary";
  }

  async function finish() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          level,
          department: isSenior ? department : null,
          course: isTertiary ? course : null,
          onboarded: true,
        })
        .eq("id", user.id);
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold mb-6">What's your level?</h1>
            {LEVELS.map((group) => (
              <div key={group.category} className="mb-4">
                <p className="text-sm text-gray-500 mb-2">{group.category}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => selectLevel(opt)}
                      className="border rounded-lg px-4 py-2"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {step === 2 && isSenior && (
          <>
            <h1 className="text-2xl font-bold mb-6">Choose your department</h1>
            <div className="flex flex-col gap-3">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDepartment(d);
                    setStep(3);
                  }}
                  className="border rounded-lg px-4 py-3 text-left"
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && isTertiary && (
          <>
            <h1 className="text-2xl font-bold mb-6">What's your course?</h1>
            <input
              type="text"
              placeholder="e.g. Computer Science"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="border rounded-lg px-4 py-3 w-full mb-4"
            />
            <button
              onClick={() => setStep(3)}
              disabled={!course}
              className="bg-blue-600 text-white rounded-lg px-4 py-3 font-medium w-full"
            >
              Continue
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold mb-6">Confirm your details</h1>
            <div className="border rounded-lg p-4 mb-6">
              <p><strong>Level:</strong> {level}</p>
              {department && <p><strong>Department:</strong> {department}</p>}
              {course && <p><strong>Course:</strong> {course}</p>}
            </div>
            <button
              onClick={finish}
              disabled={loading}
              className="bg-blue-600 text-white rounded-lg px-4 py-3 font-medium w-full"
            >
              {loading ? "Saving..." : "Confirm & Continue"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

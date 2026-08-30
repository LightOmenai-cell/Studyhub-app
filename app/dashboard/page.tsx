import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarded) {
    redirect("/onboarding");
  }

  // --- 7-day quiz activity data ---
  const dayKeys: string[] = [];
  const dayLabels: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
    dayLabels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
  }

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: quizRows } = await supabase
    .from("quiz_history")
    .select("created_at, correct_count, wrong_count, unanswered_count")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString());

  const buckets: Record<string, { correct: number; wrong: number; quizzes: number }> = {};
  dayKeys.forEach((key) => {
    buckets[key] = { correct: 0, wrong: 0, quizzes: 0 };
  });

  (quizRows || []).forEach((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (buckets[key]) {
      buckets[key].correct += row.correct_count || 0;
      buckets[key].wrong += row.wrong_count || 0;
      buckets[key].quizzes += 1;
    }
  });

  const maxTotal = Math.max(
    1,
    ...dayKeys.map((key) => buckets[key].correct + buckets[key].wrong)
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-8 text-center">
      <h1 className="text-3xl font-bold mb-2">
        Welcome back, {profile?.name || "Student"} 👋
      </h1>
      <p className="text-gray-600 mb-8">
        {profile?.level}
        {profile?.department ? ` — ${profile.department}` : ""}
        {profile?.course ? ` — ${profile.course}` : ""}
      </p>

      {/* 7-day quiz activity graph */}
      <div className="w-full max-w-md bg-white rounded-xl shadow p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Last 7 Days</h2>

        <div className="flex items-end justify-between h-40 gap-2">
          {dayKeys.map((key, i) => {
            const { correct, wrong } = buckets[key];
            const total = correct + wrong;
            const barHeight = (total / maxTotal) * 100;
            const correctHeight = total > 0 ? (correct / total) * barHeight : 0;
            const wrongHeight = total > 0 ? (wrong / total) * barHeight : 0;

            return (
              <div key={key} className="flex flex-col items-center flex-1 h-full justify-end">
                <div
                  className="w-full flex flex-col justify-end rounded-t overflow-hidden bg-gray-100"
                  style={{ height: "100%" }}
                >
                  <div style={{ height: `${wrongHeight}%` }} className="bg-red-400 w-full" />
                  <div style={{ height: `${correctHeight}%` }} className="bg-green-500 w-full" />
                </div>
                <span className="text-xs text-gray-500 mt-1">{dayLabels[i]}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4 mt-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            Correct
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
            Wrong
          </div>
        </div>
      </div>

      <a href="/settings" className="text-blue-600 font-medium">
        Go to settings
      </a>
    </main>
  );
        }

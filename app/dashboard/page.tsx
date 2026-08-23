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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold mb-2">
        Welcome back, {profile?.name || "Student"} 👋
      </h1>
      <p className="text-gray-600 mb-8">
        {profile?.level}
        {profile?.department ? ` — ${profile.department}` : ""}
        {profile?.course ? ` — ${profile.course}` : ""}
      </p>
      <a
        href="/settings"
        className="text-blue-600 font-medium"
      >
        Go to settings
      </a>
    </main>
  );
}

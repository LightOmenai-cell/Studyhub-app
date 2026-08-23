"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setLevel(profile.level || "");
        setDepartment(profile.department || "");
        setCourse(profile.course || "");
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ level, department, course })
        .eq("id", user.id);
    }
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <label className="block text-sm text-gray-600 mb-1">Level</label>
        <input
          type="text"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="border rounded-lg px-4 py-3 w-full mb-4"
        />

        <label className="block text-sm text-gray-600 mb-1">Department (if applicable)</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="border rounded-lg px-4 py-3 w-full mb-4"
        />

        <label className="block text-sm text-gray-600 mb-1">Course (if tertiary)</label>
        <input
          type="text"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="border rounded-lg px-4 py-3 w-full mb-6"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white rounded-lg px-4 py-3 font-medium w-full mb-3"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        <button
          onClick={handleLogout}
          className="border border-red-600 text-red-600 rounded-lg px-4 py-3 font-medium w-full"
        >
          Log out
        </button>
      </div>
    </main>
  );
}

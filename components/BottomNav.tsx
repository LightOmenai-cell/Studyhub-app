"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, FileQuestion, Settings } from "lucide-react";

const tabs = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Books", href: "/books", icon: BookOpen },
  { name: "Past Qs", href: "/past-questions", icon: FileQuestion },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center text-xs ${
              isActive ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <Icon size={22} />
            <span className="mt-1">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

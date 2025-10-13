"use client";

import Link from "next/link";
import TodoApp from "@/components/TodoApp.jsx";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">To‑Do</h1>
        <TodoApp />
        <div className="mt-6 flex justify-center">
          <Link href="/xui" className="inline-flex items-center gap-2 rounded bg-purple-600 hover:bg-purple-700 text-white px-4 py-2">
            XUI
          </Link>
        </div>
      </div>
    </div>
  );
}

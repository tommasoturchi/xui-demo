"use client";

import Link from "next/link";
import InfoPopover from "@/components/InfoPopover.jsx";
import TodoApp from "@/components/TodoApp.jsx";
import ExplanationPanel from "@/components/ExplanationPanel.jsx";

export default function XuiHome() {
  return (
    <div className="min-h-screen p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4 relative">
          <h1 className="text-2xl font-bold">To‑Do (XUI)</h1>
          <InfoPopover />
        </div>
        <TodoApp />
      </div>

      <ExplanationPanel />
    </div>
  );
}



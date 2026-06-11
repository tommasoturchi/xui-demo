"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

export default function InfoPopover() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full w-8 h-8 inline-flex items-center justify-center border border-black/10 dark:border-white/20 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
        aria-label="Show info"
      >
        <Info size={16} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md border border-black/10 dark:border-white/20 bg-white dark:bg-black shadow-lg p-4 text-sm leading-relaxed"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold">About this To‑Do App</div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full w-7 h-7 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <ul className="list-disc pl-5 space-y-1 opacity-90">
              <li>Completed items are auto‑archived after ~10 seconds.</li>
              <li>Adding a near‑duplicate updates the existing task name; if archived, it is unarchived.</li>
              <li>“Archive” view lets you restore or permanently delete archived items.</li>
            </ul>

            <div className="mt-4">
              <div className="font-semibold mb-1">Research behind this demo</div>
              <p className="opacity-90 mb-1">
                This demo is based on ideas from the following papers:
              </p>
              <ul className="list-disc pl-5 space-y-1 opacity-90">
                <li>
                  <a
                    href="https://dl.acm.org/doi/10.14236/ewic/BCSHCI2025.24"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                  >
                    https://dl.acm.org/doi/10.14236/ewic/BCSHCI2025.24
                  </a>
                </li>
                <li>
                  <a
                    href="https://dl.acm.org/doi/full/10.1145/3811427.3811499"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                  >
                    https://dl.acm.org/doi/full/10.1145/3811427.3811499
                  </a>
                </li>
              </ul>
            </div>

            <div className="mt-4">
              <div className="font-semibold mb-1">Explainer video</div>
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  src="https://player.vimeo.com/video/1092230788"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded"
                  title="Demo explainer video"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

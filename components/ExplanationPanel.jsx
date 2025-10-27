"use client";

import { useContext, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ExplanationContext } from "@/context/ExplanationContext.jsx";

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

const LOG_LEVEL_CLASS = {
  debug: "text-gray-500", // lexical interactions
  info: "text-blue-600", // syntactic state updates
  notice: "text-green-600", // semantic user intent
  warning: "text-yellow-600",
  error: "text-red-600",
};

const LEVEL_BADGE_CLASS = {
  debug: "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200",
  info: "bg-blue-100 dark:bg-white/10 text-blue-700 dark:text-blue-300",
  notice: "bg-green-100 dark:bg-white/10 text-green-700 dark:text-green-300",
};
const ACTION_BADGE_CLASS = {
  user: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300",
  auto: "bg-orange-100 dark:bg-white/10 text-orange-700 dark:text-orange-300",
};

function EventItem({ event, children }) {
  const [expanded, setExpanded] = useState(false);
  const base = LOG_LEVEL_CLASS[event.logLevel] || "text-blue-600";
  const color = event.actionType === "auto" ? "text-orange-600" : base;
  const levelLabel = event.logLevel === "debug" ? "Lexical" : event.logLevel === "info" ? "Syntactic" : event.logLevel === "notice" ? "Semantic" : event.logLevel;
  const levelBadgeClass = LEVEL_BADGE_CLASS[event.logLevel] || LEVEL_BADGE_CLASS.info;
  const actionBadgeClass = ACTION_BADGE_CLASS[event.actionType] || ACTION_BADGE_CLASS.user;
  const hint = (() => {
    // Avoid repeating the same text already used as component or description
    const aria = event?.details?.ariaLabel;
    const snippet = event?.details?.textSnippet;
    if (aria && (event.component === aria || event.description?.includes(aria))) return null;
    if (snippet && (event.component?.includes(snippet) || event.description?.includes(snippet))) return null;
    if (event?.details?.key) return `Key ${event.details.key}`;
    return aria || snippet || null;
  })();
  return (
    <div className={`mb-2`}>
      <div className={`text-sm ${color} flex items-start gap-2`}>
        <div className="flex-1">
          <span className="opacity-60 mr-2">{formatTime(event.timestamp)}</span>
          <span className="font-semibold mr-2">[{event.component}]</span>
          <span className="break-words whitespace-normal max-w-full inline-block align-top">{event.description}</span>
          {hint && <span className="opacity-70 ml-2">({hint})</span>}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${levelBadgeClass}`} aria-label={`Level ${levelLabel}`}>{levelLabel}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${actionBadgeClass}`} aria-label={`Action ${event.actionType}`}>{event.actionType}</span>
        </div>
        {event.details && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-slate-400"
            aria-label={expanded ? "Hide details" : "Show details"}
          >
            <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : "rotate-0"}`} />
          </button>
        )}
      </div>
      {event.details && expanded && (
        <pre className="text-xs opacity-80 overflow-x-auto bg-black/5 dark:bg-white/5 rounded p-2 mt-1">{JSON.stringify(event.details, null, 2)}</pre>
      )}
      {children}
    </div>
  );
}

export default function ExplanationPanel() {
  const { eventLog, levelsEnabled, toggleLevel, focusTaskId, setFocusTaskId } = useContext(ExplanationContext);
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const byId = new Map();
    const roots = [];
    for (const e of [...eventLog].reverse()) { // chronological
      byId.set(e.id, { ...e, children: [] });
    }
    for (const e of byId.values()) {
      if (e.parentId && byId.has(e.parentId)) {
        byId.get(e.parentId).children.push(e);
      } else {
        roots.push(e);
      }
    }
    return roots.reverse(); // newest first
  }, [eventLog]);

  const filtered = useMemo(() => {
    const base = grouped.filter((e) => levelsEnabled[e.level]);
    if (!focusTaskId) return base;
    const keep = (evt) => !!(evt.details && (evt.details.id === focusTaskId || evt.details.task?.id === focusTaskId));
    return base
      .map((evt) => ({ ...evt, children: (evt.children || []).filter(keep) }))
      .filter((evt) => keep(evt) || (evt.children && evt.children.length > 0));
  }, [grouped, levelsEnabled, focusTaskId]);

  return (
    <div className="fixed left-0 right-0 bottom-0" style={{ zIndex: 30 }}>
      <div
        className={`absolute inset-x-0 bottom-0 transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-[calc(100%-6px)]"}`}
        style={{ height: "60vh" }}
        data-explain-ui="explanation"
      >
        {/* Handle sits on the top edge of the sliding panel and moves with it */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-6 rounded-t-xl bg-black/10 dark:bg-white/10 backdrop-blur border border-black/10 dark:border-white/10 flex items-center justify-center"
          aria-label={open ? "Close explanation" : "Open explanation"}
          data-explain-ui="explain-handle"
        >
          <div className="w-10 h-1.5 rounded-full bg-black/30 dark:bg-white/30" />
        </button>

        <div className="h-[60vh] border-t border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur p-4 pt-6 flex flex-col" aria-label="Explanation log panel">
          <div className="sticky top-0 z-10 bg-white/90 dark:bg-black/90 backdrop-blur pb-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold">Explanation</span>
              <div className="ml-auto flex items-center gap-2 text-sm">
                <button
                  onClick={() => toggleLevel("semantic")}
                  className={`px-2 py-0.5 rounded border ${levelsEnabled.semantic ? "bg-black/10 dark:bg-white/10 border-transparent" : "border-black/10 dark:border-white/20"}`}
                  aria-pressed={levelsEnabled.semantic}
                  aria-label={`Toggle semantic logs ${levelsEnabled.semantic ? "on" : "off"}`}
                >
                  Semantic
                </button>
                <button
                  onClick={() => toggleLevel("syntactic")}
                  className={`px-2 py-0.5 rounded border ${levelsEnabled.syntactic ? "bg-black/10 dark:bg-white/10 border-transparent" : "border-black/10 dark:border-white/20"}`}
                  aria-pressed={levelsEnabled.syntactic}
                  aria-label={`Toggle syntactic logs ${levelsEnabled.syntactic ? "on" : "off"}`}
                >
                  Syntactic
                </button>
                <button
                  onClick={() => toggleLevel("lexical")}
                  className={`px-2 py-0.5 rounded border ${levelsEnabled.lexical ? "bg-black/10 dark:bg-white/10 border-transparent" : "border-black/10 dark:border-white/20"}`}
                  aria-pressed={levelsEnabled.lexical}
                  aria-label={`Toggle lexical logs ${levelsEnabled.lexical ? "on" : "off"}`}
                >
                  Lexical
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200">Lexical</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-white/10 text-blue-700 dark:text-blue-300">Syntactic</span>
              <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-white/10 text-green-700 dark:text-green-300">Semantic</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-white/10 text-orange-700 dark:text-orange-300 ml-2">auto</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">user</span>
              {!!focusTaskId && (
                <button onClick={() => setFocusTaskId(null)} className="ml-auto text-xs underline opacity-80 hover:opacity-100" aria-label="Clear task focus">Clear task focus</button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((e) => {
              const visibleChildren = (e.children || []).filter((c) => levelsEnabled[c.level]);
              return (
                <div key={e.id} className="mb-3">
                  <EventItem event={e}>
                    {visibleChildren.length > 0 && (
                      <div className="ml-4 mt-1 border-l pl-2 border-black/10 dark:border-white/10">
                        {visibleChildren.map((c) => (
                          <EventItem key={c.id} event={c} />
                        ))}
                      </div>
                    )}
                  </EventItem>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}



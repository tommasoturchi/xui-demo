 "use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import useExplainableState from "@/hooks/useExplainableState.js";
import { ExplanationContext } from "@/context/ExplanationContext.jsx";
import { isNearDuplicate } from "@/lib/similarity.js";
import {
  ArrowUp,
  ArrowDown,
  Archive,
  Trash2,
  RotateCcw,
  Plus,
  CheckSquare,
  Square,
} from "lucide-react";

export default function ExplainableTodoApp() {
  const { logEvent } = useContext(ExplanationContext);
  // XUI: use explainable state to emit syntactic/semantic logs alongside updates
  // Non‑XUI: replace with React's useState, e.g.
  //   const [tasks, setTasks] = useState([]);
  // Non‑XUI version would keep a single list with an `archived` flag too
  const [tasks, setTasksWithExplain] = useExplainableState([], "TodoApp");
  const [view, setView] = useState("active"); // 'active' | 'archive'
  const [newText, setNewText] = useState("");
  const inputRef = useRef(null);
  const addEnabledRef = useRef(false);
  const emptyEnabledRef = useRef(false);
  const autoArchiveTimersRef = useRef(new Map());

  const addTask = (text, e) => {
    // XUI: record a syntactic log; Non‑XUI: omit this line
    logEvent("Pressed Add", "TodoApp", text, "user", "syntactic");

    const trimmed = (text || "").trim();
    if (!trimmed) return;

    // Duplicate detection across all tasks (including archived)
    const match = tasks.find((t) => isNearDuplicate(t.text, trimmed));
    if (match) {
      const wasArchived = !!match.archived;
      const previousText = match.text;

      // User intent (semantic): the user tried to add a task that matches an existing one
      logEvent(
        "Add task (duplicate detected)",
        "TodoApp",
        { text: trimmed, matchedId: match.id },
        "user",
        "semantic"
      );

      // Auto (semantic): rename existing task to new text (only if changed)
      if (trimmed !== previousText) {
        setTasksWithExplain(
          (prev) =>
            prev.map((t) => (t.id === match.id ? { ...t, text: trimmed } : t)),
          "Updated existing task name",
          { id: match.id, previousText, newText: trimmed, auto: true }
        );
      }

      // Auto (semantic): unarchive if needed
      if (wasArchived) {
        setTasksWithExplain(
          (prev) =>
            prev.map((t) =>
              t.id === match.id ? { ...t, archived: false } : t
            ),
          "Unarchived task",
          { id: match.id, auto: true }
        );
      }

      inputRef.current && (inputRef.current.value = "");
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      archived: false,
    };
    // XUI: state update emits syntactic + semantic logs via helper
    // Non‑XUI: call setTasks([...]) with no logging
    setTasksWithExplain(
      (prev) => [newTask, ...prev],
      `Added task: ${trimmed}`,
      { task: newTask }
    );
    setNewText("");
  };

  const toggleComplete = (id, e) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    const toggled = updated.find((t) => t.id === id);
    // XUI: logs the state change; Non‑XUI: setTasks(updated)
    setTasksWithExplain(
      updated,
      toggled.completed ? "Marked task complete" : "Marked task incomplete",
      { id }
    );

    // Auto-archive after 10s if completed
    if (toggled.completed) {
      const timerId = setTimeout(() => {
        archiveTask(id, { auto: true, elapsedMs: 10000 });
      }, 10000);
      autoArchiveTimersRef.current.set(id, timerId);
      // Scheduling is silent; we explain when the auto action actually occurs
    } else {
      const existing = autoArchiveTimersRef.current.get(id);
      if (existing) {
        clearTimeout(existing);
        autoArchiveTimersRef.current.delete(id);
        // Silent: cancelling the timer doesn't need its own log entry
      }
    }
  };

  const archiveTask = (id, options = {}, e = null) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;

    // Clear auto-archive timer if manually archiving
    if (!options.auto) {
      const existing = autoArchiveTimersRef.current.get(id);
      if (existing) {
        clearTimeout(existing);
        autoArchiveTimersRef.current.delete(id);
      }
    }

    // XUI: mark item archived in-place; Non‑XUI: setTasks(prev => prev.map(...))
    const archivedDesc = options.auto
      ? "Auto-archived task after 10s"
      : "Archived task";
    setTasksWithExplain(
      (prev) => prev.map((x) => (x.id === id ? { ...x, archived: true } : x)),
      archivedDesc,
      { id, auto: !!options.auto, elapsedMs: options.elapsedMs }
    );
  };

  const restoreTask = (id, e) => {
    const t = tasks.find((x) => x.id === id && x.archived);
    if (!t) return;

    // Clear any auto-archive timer when restoring
    const existing = autoArchiveTimersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      autoArchiveTimersRef.current.delete(id);
    }

    // XUI: mark as not archived; Non‑XUI: setTasks(prev => prev.map(...))
    setTasksWithExplain(
      (prev) => prev.map((x) => (x.id === id ? { ...x, archived: false } : x)),
      "Restored task",
      { id }
    );
  };

  const deleteTask = (id, e) => {
    // Clear any auto-archive timer when permanently deleting
    const existing = autoArchiveTimersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      autoArchiveTimersRef.current.delete(id);
    }

    // XUI: remove from list when permanently deleting from archive; Non‑XUI: similar
    setTasksWithExplain(
      (prev) => prev.filter((x) => x.id !== id),
      "Deleted permanently",
      { id }
    );
  };

  const emptyArchive = (e) => {
    // Clear all auto-archive timers when emptying trash
    for (const [id, timerId] of autoArchiveTimersRef.current) {
      clearTimeout(timerId);
    }
    autoArchiveTimersRef.current.clear();

    // XUI: remove all archived tasks; Non‑XUI: setTasks(prev => prev.filter(!archived))
    const count = tasks.filter((t) => t.archived).length;
    setTasksWithExplain(
      (prev) => prev.filter((t) => !t.archived),
      "Emptied archive",
      { count }
    );
  };

  const moveTask = (id, direction, e) => {
    const index = tasks.findIndex((t) => t.id === id);
    if (index < 0) return;
    const newIndex =
      direction === "up"
        ? Math.max(0, index - 1)
        : Math.min(tasks.length - 1, index + 1);
    if (newIndex === index) return;
    const arr = [...tasks];
    const [item] = arr.splice(index, 1);
    arr.splice(newIndex, 0, item);
    // XUI: emits logs; Non‑XUI: setTasks(arr)
    setTasksWithExplain(arr, `Reordered task ${direction}`, {
      id,
      from: index,
      to: newIndex,
    });
  };

  // Track archive count to enable/disable the Empty archive button and log syntactic changes
  const archivedCount = useMemo(
    () => tasks.filter((t) => t.archived).length,
    [tasks]
  );
  useEffect(() => {
    const enabled = archivedCount > 0;
    if (enabled !== emptyEnabledRef.current) {
      logEvent(
        enabled ? "Enabled Empty archive" : "Disabled Empty archive",
        "TodoApp",
        { archivedCount },
        "auto",
        "syntactic"
      );
      emptyEnabledRef.current = enabled;
    }
  }, [archivedCount, logEvent]);

  const handleAddClick = (e) => {
    addTask(newText, e);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      addTask(newText, e);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a task"
          onKeyDown={handleEnter}
          aria-label="Task input"
          value={newText}
          onChange={(e) => {
            const v = e.target.value;
            setNewText(v);
            const enabled = v.trim().length > 0;
            if (enabled !== addEnabledRef.current) {
              logEvent(
                enabled ? "Enabled Add button" : "Disabled Add button",
                "TodoApp",
                { length: v.trim().length },
                "auto",
                "syntactic"
              );
              addEnabledRef.current = enabled;
            }
          }}
          className="flex-1 rounded border border-black/10 dark:border-white/20 px-3 py-2 bg-transparent"
        />
        <button
          onClick={handleAddClick}
          disabled={!newText.trim()}
          className="inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2"
          aria-label="Add task"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setView("active")}
          className={`px-3 py-1 rounded ${
            view === "active"
              ? "bg-black/10 dark:bg-white/10"
              : "border border-black/10 dark:border-white/20"
          }`}
          aria-label="Show active tasks"
        >
          Active
        </button>
        <button
          onClick={() => setView("archive")}
          className={`px-3 py-1 rounded ${
            view === "archive"
              ? "bg-black/10 dark:bg:white/10"
              : "border border-black/10 dark:border-white/20"
          }`}
          aria-label="Show archive"
        >
          Archive
        </button>
        {view === "archive" && (
          <button
            onClick={emptyArchive}
            disabled={archivedCount === 0}
            className="ml-auto px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Empty archive"
          >
            Empty archive
          </button>
        )}
      </div>

      {view === "active" ? (
        <ul className="space-y-2">
          {tasks
            .filter((t) => !t.archived)
            .map((t, idx) => (
              <li
                key={t.id}
                className="flex items-center gap-2 border border-black/10 dark:border-white/20 rounded p-2"
              >
                <button
                  onClick={(e) => toggleComplete(t.id, e)}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                  aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {t.completed ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
                <span
                  className={`flex-1 ${
                    t.completed ? "line-through opacity-60" : ""
                  }`}
                >
                  {t.text}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => moveTask(t.id, "up", e)}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                    aria-label="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={(e) => moveTask(t.id, "down", e)}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                    aria-label="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    onClick={(e) => archiveTask(t.id, {}, e)}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                    aria-label="Archive"
                  >
                    <Archive size={16} />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {tasks
            .filter((t) => t.archived)
            .map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2 border border-black/10 dark:border-white/20 rounded p-2"
              >
                <span className="flex-1">{t.text}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => restoreTask(t.id, e)}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg:white/5"
                    aria-label="Restore"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={(e) => deleteTask(t.id, e)}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg:white/5 text-red-600"
                    aria-label="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}


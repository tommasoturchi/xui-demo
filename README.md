# XUI Demo – Explainable UI for a To‑Do App

This repo contains two variants of a simple To‑Do app:

- Vanilla: plain UX, no explanations (default route `/`)
- XUI: explainable UX with a bottom sliding log of actions and causes (`/xui`)

The goal is to demonstrate how a small amount of instrumentation and global listeners can provide meaningful explanations of what happened, why it happened, and what can be redone.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Routes

- `/` – Vanilla app (no explanations). Includes a centered “XUI” button linking to `/xui`.
- `/xui` – Explainable app with:
  - Bottom sliding panel with a handle (no extra buttons on the page)
  - Per-level toggles for Lexical, Syntactic, Semantic
  - Collapsible details per row; level and action badges
  - Global lexical logging for clicks/keys using aria-labels/labels
  - Task-focused history via the “…” button on each task

## Key files

- `components/TodoApp.jsx` – To‑Do UI and minimal XUI instrumentation
- `components/ExplanationPanel.jsx` – Sliding panel and log UI
- `context/ExplanationContext.jsx` – Log store, global lexical listeners, filters
- `hooks/useExplainableState.js` – State helper that emits syntactic/semantic events

## What’s instrumented (XUI)

- Global lexical events (click/keydown) with aria-label and text snippets
- Syntactic state changes (e.g., state updates, enable/disable of controls)
- Semantic actions (e.g., add task, archive after 10s, revive archived duplicate)

## Compare vanilla vs XUI

The vanilla app uses the same components but no panel or extra logging. The XUI variant adds the context provider and panel, and emits events. Compare the code comments in `TodoApp.jsx` where we note the non‑XUI alternatives.

## Notes

- Lexical logs are off by default; enable via panel toggles.
- The panel handle peeks only; the panel is fully off-screen when closed.
- Privacy: keydown logs can be masked if needed (simple to add by trimming details).

## License

MIT

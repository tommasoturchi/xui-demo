"use client";

import { useContext, useState, useCallback } from "react";
import { ExplanationContext } from "@/context/ExplanationContext.jsx";

export default function useExplainableState(
  initialState,
  componentLabel,
  options = {}
) {
  const { logEvent } = useContext(ExplanationContext);
  const [state, setState] = useState(initialState);

  const logLexical = useCallback(
    (e, description = "Clicked", extra = {}, parentId = null) => {
      const coords =
        typeof e === "object" && e
          ? { x: e.clientX ?? null, y: e.clientY ?? null }
          : {};
      logEvent(
        description,
        componentLabel,
        { ...extra, coords },
        "user",
        "lexical",
        parentId
      );
    },
    [logEvent, componentLabel]
  );

  const logSyntactic = useCallback(
    (description, details = {}, actionType = "user") => {
      logEvent(description, componentLabel, details, actionType, "syntactic");
    },
    [logEvent, componentLabel]
  );

  const logSemantic = useCallback(
    (description, details = {}, actionType = "user") => {
      return logEvent(
        description,
        componentLabel,
        details,
        actionType,
        "semantic"
      );
    },
    [logEvent, componentLabel]
  );

  const setStateWithExplain = useCallback(
    (next, semanticDescription, details = {}) => {
      const actionType = details.auto ? "auto" : "user";
      logSyntactic("State update", details, actionType);
      const resolved = typeof next === "function" ? next(state) : next;
      setState(resolved);
      const sem = logSemantic(
        semanticDescription,
        { newState: resolved, ...details },
        actionType
      );
      return sem;
    },
    [state, logSyntactic, logSemantic]
  );

  return [
    state,
    setStateWithExplain,
    { setState, logLexical, logSyntactic, logSemantic },
  ];
}

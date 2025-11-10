/**
 * useRunExecutionState Hook
 * ---------------------------------------
 * Handles the global "run" execution state across the app.
 * It lets multiple components know when code execution starts or stops —
 * for example, when a user clicks the "Run" button in the editor.
 *
 * The hook listens for a global event (`run-execution-state`) and updates
 * in real time, while `emitRunExecutionState()` triggers the change.
 *
 *   Typical use cases:
 * - Disabling the "Run" button while code is executing.
 * - Showing a terminal spinner or “Running…” label.
 * - Letting multiple panels react to the same global run signal.
 */

import { useEffect, useState } from "react";

/** 🔹 Global event name used to sync run execution state */
const RUN_EXECUTION_EVENT = "run-execution-state";

/** 🔹 Event payload structure */
type RunExecutionDetail = {
  running: boolean;
};

/**
 * emitRunExecutionState
 * ---------------------------------------
 * Broadcasts a window-level event notifying all listeners
 * whether code execution is currently active or not.
 *
 * This is typically called from the editor or terminal
 * before and after code execution.
 *
 * Example:
 * ```ts
 * emitRunExecutionState(true);  // → start running
 * emitRunExecutionState(false); // → stop running
 * ```
 */
export function emitRunExecutionState(running: boolean) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<RunExecutionDetail>(RUN_EXECUTION_EVENT, {
      detail: { running },
    }),
  );
}

/**
 * useRunExecutionState
 * ---------------------------------------
 * A React hook that listens for the global `run-execution-state` event.
 * Whenever `emitRunExecutionState()` is triggered, all components using
 * this hook instantly reflect the current execution status.
 *
 * Example:
 * ```tsx
 * const isRunning = useRunExecutionState();
 *
 * return (
 *   <button disabled={isRunning}>
 *     {isRunning ? "Running…" : "Run"}
 *   </button>
 * );
 * ```
 */
export function useRunExecutionState(initial = false) {
  const [running, setRunning] = useState(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<RunExecutionDetail>;
      setRunning(Boolean(customEvent.detail?.running));
    };

    window.addEventListener(RUN_EXECUTION_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(RUN_EXECUTION_EVENT, handler as EventListener);
    };
  }, []);

  return running;
}

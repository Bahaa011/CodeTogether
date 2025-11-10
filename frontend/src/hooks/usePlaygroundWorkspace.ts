/**
 * usePlaygroundWorkspace Hook
 *
 * Manages the state and behavior of the in-browser coding playground.
 * Provides multi-language code editing, execution, and terminal visibility control.
 *
 * Responsibilities:
 * - Maintain the active language and associated code content.
 * - Track running/execution state and terminal visibility.
 * - Emit custom "run-file-requested" events for sandboxed execution.
 * - Produce an `EditorFileState` compatible object for integration with editor components.
 */

import { useCallback, useMemo, useState } from "react";
import type { EditorFileState } from "./useProjectEditor";
import {
  emitRunExecutionState,
  useRunExecutionState,
} from "./useRunExecutionState";

/**
 * PlaygroundLanguage
 *
 * Defines a language entry available in the playground.
 *
 * Fields:
 * - id: Unique identifier for the language (e.g., "javascript", "python", "cpp", "java").
 * - label: Human-readable name shown in dropdowns or tabs.
 * - filename: Default filename for the language (e.g., "main.py").
 * - sample: Initial code sample preloaded into the editor.
 */
export type PlaygroundLanguage = {
  id: "javascript" | "python" | "cpp" | "java";
  label: string;
  filename: string;
  sample: string;
};

/**
 * usePlaygroundWorkspace
 *
 * Provides full reactive management for a multi-language coding workspace.
 *
 * Returns:
 * - activeLanguageId: The ID of the currently active language.
 * - editorFile: Editor-compatible state for the active language.
 * - running: Boolean state indicating whether code is currently executing.
 * - terminalOpen: Whether the terminal/output panel is visible.
 * - handleLanguageChange(id): Switches the current programming language.
 * - handleCodeChange(value): Updates the code content for the active language.
 * - handleRun(): Dispatches a "run-file-requested" event for code execution.
 * - toggleTerminal(): Toggles terminal visibility on/off.
 */
export function usePlaygroundWorkspace(languages: PlaygroundLanguage[]) {
  /** Default to the first provided language (fallback to JavaScript). */
  const defaultLanguageId = languages[0]?.id ?? "javascript";

  /** Active language ID. */
  const [activeId, setActiveId] =
    useState<PlaygroundLanguage["id"]>(defaultLanguageId);

  /**
   * Stores the source code for each language in a map:
   * { javascript: "...", python: "...", cpp: "..." }
   */
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    languages.forEach((lang) => {
      seed[lang.id] = lang.sample;
    });
    return seed;
  });

  /** Tracks execution state shared globally via `useRunExecutionState`. */
  const running = useRunExecutionState();

  /** Tracks visibility of the terminal/output panel. */
  const [terminalOpen, setTerminalOpen] = useState(true);

  /** Derived reference to the active language object and its source code. */
  const activeLanguage =
    languages.find((lang) => lang.id === activeId) ?? languages[0];
  const activeCode =
    (activeLanguage && codeMap[activeLanguage.id]) ??
    activeLanguage?.sample ??
    "";

  /**
   * Editor-compatible file representation.
   * This structure matches the format used by the main project editor.
   */
  const editorFile: EditorFileState = useMemo(
    () => ({
      id: `${activeLanguage?.id ?? "playground"}-file`.length,
      filename: activeLanguage?.filename ?? "main.ts",
      file_type: activeLanguage?.id ?? "javascript",
      content: activeCode,
      updated_at: new Date().toISOString(),
      draftContent: activeCode,
      dirty: false,
      saving: false,
      saveError: null,
    }),
    [activeLanguage?.filename, activeLanguage?.id, activeCode],
  );

  /**
   * handleLanguageChange
   *
   * Switches the active language tab in the playground.
   */
  const handleLanguageChange = useCallback(
    (id: PlaygroundLanguage["id"]) => {
      setActiveId(id);
    },
    [],
  );

  /**
   * handleCodeChange
   *
   * Updates the code content for the currently active language.
   */
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (!activeLanguage) return;
      setCodeMap((prev) => ({
        ...prev,
        [activeLanguage.id]: value ?? "",
      }));
    },
    [activeLanguage],
  );

  /**
   * handleRun
   *
   * Dispatches a "run-file-requested" event to trigger execution
   * of the current active language code in a sandbox environment.
   * Also opens the terminal and emits a global execution state.
   */
  const handleRun = useCallback(() => {
    if (typeof window === "undefined" || !activeLanguage) return;

    emitRunExecutionState(true);
    setTerminalOpen(true);

    const detail = {
      fileId: Date.now(),
      filename: activeLanguage.filename,
      code: activeCode,
      fileType: activeLanguage.id,
      language: activeLanguage.id,
    };

    window.dispatchEvent(new CustomEvent("run-file-requested", { detail }));
  }, [activeCode, activeLanguage]);

  /**
   * toggleTerminal
   *
   * Opens or closes the output terminal.
   */
  const toggleTerminal = useCallback(() => {
    setTerminalOpen((open) => !open);
  }, []);

  // --- Return Hook API ---
  return {
    activeLanguageId: activeLanguage?.id ?? defaultLanguageId,
    editorFile,
    running,
    terminalOpen,
    handleLanguageChange,
    handleCodeChange,
    handleRun,
    toggleTerminal,
  };
}

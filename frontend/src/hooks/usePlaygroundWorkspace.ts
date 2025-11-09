import { useCallback, useMemo, useState } from "react";
import type { EditorFileState } from "./useProjectEditor";
import { emitRunExecutionState, useRunExecutionState } from "./useRunExecutionState";

export type PlaygroundLanguage = {
  id: "javascript" | "python" | "cpp" | "java";
  label: string;
  filename: string;
  sample: string;
};

export function usePlaygroundWorkspace(languages: PlaygroundLanguage[]) {
  const defaultLanguageId = languages[0]?.id ?? "javascript";
  const [activeId, setActiveId] =
    useState<PlaygroundLanguage["id"]>(defaultLanguageId);
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    languages.forEach((lang) => {
      seed[lang.id] = lang.sample;
    });
    return seed;
  });
  const running = useRunExecutionState();
  const [terminalOpen, setTerminalOpen] = useState(true);

  const activeLanguage =
    languages.find((lang) => lang.id === activeId) ?? languages[0];
  const activeCode =
    (activeLanguage && codeMap[activeLanguage.id]) ??
    activeLanguage?.sample ??
    "";

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

  const handleLanguageChange = useCallback(
    (id: PlaygroundLanguage["id"]) => {
      setActiveId(id);
    },
    [],
  );

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (!activeLanguage) {
        return;
      }
      setCodeMap((prev) => ({
        ...prev,
        [activeLanguage.id]: value ?? "",
      }));
    },
    [activeLanguage],
  );

  const handleRun = useCallback(() => {
    if (typeof window === "undefined" || !activeLanguage) {
      return;
    }
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

  const toggleTerminal = useCallback(() => {
    setTerminalOpen((open) => !open);
  }, []);

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

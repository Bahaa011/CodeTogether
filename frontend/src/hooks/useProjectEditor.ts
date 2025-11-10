/**
 * useProjectEditor Hook
 *
 * Provides a full-featured file management system for a project-based
 * code editor. Handles fetching, editing, saving, creating, deleting,
 * and syncing project files while maintaining a reactive editing state.
 *
 * Responsibilities:
 * - Fetch and normalize project files from the backend.
 * - Manage file opening, closing, and active file selection.
 * - Track unsaved changes and handle file saving and error states.
 * - Support new file creation, deletion, and content synchronization.
 * - Expose an interface compatible with Monaco or similar editors.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createProjectFile,
  deleteProjectFile,
  fetchProjectFiles,
  updateProjectFile,
  type ProjectFile,
} from "../services/fileService";

/**
 * EditorFileState
 *
 * Represents a file currently being edited in the workspace.
 * Extends the base `ProjectFile` type with editor-specific metadata.
 *
 * Fields:
 * - draftContent: Unsaved code currently in the editor.
 * - dirty: Whether the draft content differs from the saved version.
 * - saving: Indicates whether the file is currently being saved.
 * - saveError: Optional error message if the last save failed.
 */
export type EditorFileState = ProjectFile & {
  draftContent: string;
  dirty: boolean;
  saving: boolean;
  saveError: string | null;
};

/**
 * EditorState
 *
 * Internal structure managing all open and loaded files.
 * - files: Mapping of file IDs to their editor states.
 * - openFileIds: List of file IDs currently open in the editor.
 * - activeFileId: The ID of the currently active (focused) file.
 */
type EditorState = {
  files: Record<number, EditorFileState>;
  openFileIds: number[];
  activeFileId: number | null;
};

/** Empty baseline editor state (used before a project is loaded). */
const emptyState: EditorState = {
  files: {},
  openFileIds: [],
  activeFileId: null,
};

/**
 * normalizeFiles
 *
 * Converts a list of raw `ProjectFile` objects into a normalized `EditorState`.
 * Sorts files alphabetically and initializes editor metadata fields.
 */
function normalizeFiles(files: ProjectFile[]): EditorState {
  if (!files.length) {
    return emptyState;
  }

  const sorted = [...files].sort((a, b) =>
    a.filename.localeCompare(b.filename),
  );
  const map: Record<number, EditorFileState> = {};

  for (const file of sorted) {
    map[file.id] = {
      ...file,
      draftContent: file.content ?? "",
      dirty: false,
      saving: false,
      saveError: null,
    };
  }

  const firstId = sorted[0]?.id ?? null;
  return {
    files: map,
    openFileIds: firstId ? [firstId] : [],
    activeFileId: firstId,
  };
}

/**
 * ProjectEditor
 *
 * Public interface returned by the `useProjectEditor` hook.
 * Defines the reactive state and all available file operations.
 */
export type ProjectEditor = {
  files: EditorFileState[];
  openFiles: EditorFileState[];
  activeFile?: EditorFileState;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // File management methods
  openFile(fileId: number): void;
  closeFile(fileId: number): void;
  selectFile(fileId: number): void;

  // Editing and saving
  updateDraft(fileId: number, value: string | undefined): void;
  saveFile(fileId: number): Promise<boolean>;

  // Data operations
  refresh(): Promise<void>;
  createFile(
    input: { filename: string; content?: string },
  ): Promise<EditorFileState>;
  syncFileContent(fileId: number, content: string, markClean?: boolean): void;
  deleteFile(fileId: number): Promise<void>;
};

/**
 * deriveFileType
 *
 * Utility that infers a file’s language type from its filename extension.
 * Used when creating new files to determine syntax highlighting.
 */
function deriveFileType(filename: string) {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "ts" || ext === "tsx") return "typescript";
  if (ext === "js" || ext === "jsx") return "javascript";
  if (ext === "json") return "json";
  if (ext === "html") return "html";
  if (ext === "css" || ext === "scss") return "css";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "py") return "python";
  if (ext === "java") return "java";
  if (ext === "c" || ext === "h") return "c";
  if (ext === "cpp" || ext === "hpp" || ext === "cc") return "cpp";
  if (ext === "cs") return "csharp";
  if (ext === "go") return "go";
  if (ext === "rs") return "rust";
  if (ext === "php") return "php";
  if (ext === "rb") return "ruby";
  if (ext === "swift") return "swift";
  if (ext === "kt" || ext === "kts") return "kotlin";
  if (ext === "sql") return "sql";
  if (ext === "sh" || ext === "bash") return "shell";
  if (ext === "yml" || ext === "yaml") return "yaml";
  if (ext === "xml") return "xml";
  if (ext === "dockerfile") return "dockerfile";
  if (ext === "env") return "properties";
  return "plaintext";
}

/**
 * useProjectEditor
 *
 * Main hook powering the project’s file editor interface.
 * Fetches, tracks, and manages the lifecycle of project files.
 *
 * Parameters:
 * - projectId: Current project ID to fetch and manage files for.
 * - currentUserId: The ID of the user performing file operations.
 *
 * Returns a `ProjectEditor` object with reactive file data and editor methods.
 */
export function useProjectEditor(
  projectId?: number | null,
  currentUserId?: number | null,
): ProjectEditor {
  // --- Core State ---
  const [state, setState] = useState<EditorState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Track component mount status to avoid state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * setFileState
   *
   * Utility to safely update a single file’s editor state.
   * Ensures immutability and prevents stale updates.
   */
  const setFileState = useCallback(
    (fileId: number, updater: (file: EditorFileState) => EditorFileState) => {
      setState((prev) => {
        const target = prev.files[fileId];
        if (!target) return prev;
        const updated = updater(target);
        if (updated === target) return prev;
        return {
          ...prev,
          files: {
            ...prev.files,
            [fileId]: updated,
          },
        };
      });
    },
    [],
  );

  /**
   * refresh
   *
   * Refetches all project files and resets the editor state.
   */
  const refresh = useCallback(async () => {
    if (!projectId) {
      if (!isMountedRef.current) return;
      setState(emptyState);
      setError("Select a project to load files.");
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const files = await fetchProjectFiles(projectId);
      if (isMountedRef.current) setState(normalizeFiles(files));
    } catch (err) {
      if (isMountedRef.current) {
        setState(emptyState);
        const message =
          err instanceof Error ? err.message : "Unable to load project files.";
        setError(message);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [projectId]);

  /**
   * Effect: Initial file fetch when a project is selected.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!projectId || cancelled || !isMountedRef.current) {
        if (!projectId && isMountedRef.current) {
          setState(emptyState);
          setError("Select a project to load files.");
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const files = await fetchProjectFiles(projectId);
        if (!cancelled && isMountedRef.current) setState(normalizeFiles(files));
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          setState(emptyState);
          const message =
            err instanceof Error ? err.message : "Unable to load project files.";
          setError(message);
        }
      } finally {
        if (!cancelled && isMountedRef.current) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /**
   * openFile
   *
   * Opens a file in the editor. If already open, simply focuses it.
   */
  const openFile = useCallback((fileId: number) => {
    setState((prev) => {
      if (!prev.files[fileId]) return prev;

      const alreadyOpen = prev.openFileIds.includes(fileId);
      return {
        ...prev,
        openFileIds: alreadyOpen
          ? prev.openFileIds
          : [...prev.openFileIds, fileId],
        activeFileId: fileId,
      };
    });
  }, []);

  /**
   * closeFile
   *
   * Closes a file tab, adjusting the active file if needed.
   */
  const closeFile = useCallback((fileId: number) => {
    setState((prev) => {
      if (!prev.openFileIds.includes(fileId)) return prev;
      const updatedOpenIds = prev.openFileIds.filter((id) => id !== fileId);
      let nextActive = prev.activeFileId;

      if (prev.activeFileId === fileId) {
        if (updatedOpenIds.length === 0) {
          nextActive = null;
        } else {
          const closedIndex = prev.openFileIds.indexOf(fileId);
          nextActive =
            updatedOpenIds[closedIndex] ??
            updatedOpenIds[updatedOpenIds.length - 1] ??
            null;
        }
      }

      return {
        ...prev,
        openFileIds: updatedOpenIds,
        activeFileId: nextActive,
      };
    });
  }, []);

  /**
   * selectFile
   *
   * Focuses or opens a specific file.
   */
  const selectFile = useCallback((fileId: number) => {
    setState((prev) => {
      if (!prev.files[fileId] || prev.activeFileId === fileId) return prev;
      return {
        ...prev,
        activeFileId: fileId,
        openFileIds: prev.openFileIds.includes(fileId)
          ? prev.openFileIds
          : [...prev.openFileIds, fileId],
      };
    });
  }, []);

  /**
   * updateDraft
   *
   * Updates the unsaved (draft) content of a file and marks it dirty.
   */
  const updateDraft = useCallback(
    (fileId: number, value: string | undefined) => {
      const nextValue = value ?? "";
      setFileState(fileId, (file) => {
        const dirty = nextValue !== file.content;
        if (
          file.draftContent === nextValue &&
          file.dirty === dirty &&
          file.saveError === null
        ) {
          return file;
        }
        return {
          ...file,
          draftContent: nextValue,
          dirty,
          saveError: dirty ? null : file.saveError,
        };
      });
    },
    [setFileState],
  );

  /**
   * saveFile
   *
   * Persists the current file’s draft content to the backend.
   * Returns true on success, false on failure.
   */
  const saveFile = useCallback(
    async (fileId: number) => {
      const current = state.files[fileId];
      if (!current) return false;

      if (!current.dirty && current.saveError === null) return true;

      const contentToSave = current.draftContent;

      setFileState(fileId, (f) => ({ ...f, saving: true, saveError: null }));

      try {
        const updated = await updateProjectFile(fileId, { content: contentToSave });

        setFileState(fileId, (f) => {
          const draftChangedWhileSaving = f.draftContent !== contentToSave;
          return {
            ...f,
            content: updated.content ?? "",
            draftContent: draftChangedWhileSaving
              ? f.draftContent
              : updated.content ?? "",
            dirty: draftChangedWhileSaving,
            saving: false,
            saveError: null,
            filename: updated.filename,
            file_type: updated.file_type,
            updated_at: updated.updated_at,
          };
        });

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save file.";
        setFileState(fileId, (f) => ({ ...f, saving: false, saveError: message }));
        return false;
      }
    },
    [setFileState, state.files],
  );

  /**
   * createFile
   *
   * Creates a new project file on the backend and opens it in the editor.
   */
  const createFile = useCallback(
    async (input: { filename: string; content?: string }) => {
      if (!projectId) throw new Error("Select a project before creating files.");
      if (!currentUserId) throw new Error("You need to be logged in to create files.");

      const trimmedName = input.filename.trim();
      if (!trimmedName) throw new Error("Filename is required.");

      const payload = {
        filename: trimmedName,
        file_type: deriveFileType(trimmedName),
        content: input.content ?? "",
        projectId,
        uploaderId: currentUserId,
      };

      const created = await createProjectFile(payload);

      const newFileState: EditorFileState = {
        ...created,
        draftContent: created.content ?? "",
        dirty: false,
        saving: false,
        saveError: null,
      };

      setState((prev) => ({
        ...prev,
        files: { ...prev.files, [created.id]: newFileState },
        openFileIds: prev.openFileIds.includes(created.id)
          ? prev.openFileIds
          : [...prev.openFileIds, created.id],
        activeFileId: created.id,
      }));

      setError(null);
      return newFileState;
    },
    [projectId, currentUserId],
  );

  /**
   * syncFileContent
   *
   * Updates the file’s content (used for collaboration or version sync).
   * Optionally marks the file as clean.
   */
  const syncFileContent = useCallback(
    (fileId: number, content: string, markClean = false) => {
      setFileState(fileId, (file) => ({
        ...file,
        content: markClean ? content : file.content,
        draftContent: content,
        dirty: markClean ? false : content !== file.content,
        saveError: null,
      }));
    },
    [setFileState],
  );

  /**
   * deleteFile
   *
   * Permanently removes a file from the project and closes its tab.
   */
  const deleteFile = useCallback(async (fileId: number) => {
    await deleteProjectFile(fileId);
    setState((prev) => {
      if (!prev.files[fileId]) return prev;
      const { [fileId]: _, ...rest } = prev.files;
      const nextOpenIds = prev.openFileIds.filter((id) => id !== fileId);
      let nextActiveId = prev.activeFileId;
      if (prev.activeFileId === fileId) {
        nextActiveId =
          nextOpenIds[nextOpenIds.length - 1] ??
          (Object.keys(rest).length
            ? Number(Object.keys(rest)[0])
            : null);
      }
      return {
        files: rest,
        openFileIds: nextOpenIds,
        activeFileId: nextActiveId,
      };
    });
  }, []);

  // --- Derived values ---
  const files = useMemo(
    () => Object.values(state.files).sort((a, b) => a.filename.localeCompare(b.filename)),
    [state.files],
  );

  const openFiles = useMemo(
    () =>
      state.openFileIds
        .map((id) => state.files[id])
        .filter(Boolean) as EditorFileState[],
    [state.files, state.openFileIds],
  );

  const activeFile = state.activeFileId
    ? state.files[state.activeFileId] ?? undefined
    : undefined;

  const hasUnsavedChanges = openFiles.some((f) => f.dirty);

  // --- Return Hook API ---
  return {
    files,
    openFiles,
    activeFile,
    loading,
    error,
    hasUnsavedChanges,
    openFile,
    closeFile,
    selectFile,
    updateDraft,
    saveFile,
    refresh,
    createFile,
    syncFileContent,
    deleteFile,
  };
}

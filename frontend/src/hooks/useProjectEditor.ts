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

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addFile,
  closeFile as closeFileAction,
  markFileSaved,
  markFileSaving,
  openFile as openFileAction,
  removeFile,
  setActiveFile as setActiveFileAction,
  setFileError,
  syncFileContent as syncFileContentAction,
  updateFileDraft,
  loadProjectFiles,
  createFileThunk,
  saveFileThunk,
  deleteFileThunk,
  type EditorFileState,
} from "../store/filesSlice";

// Re-export type so other hooks can import from this module
export type { EditorFileState } from "../store/filesSlice";

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
  const dispatch = useAppDispatch();
  const record = useAppSelector((state) =>
    projectId ? state.files.byProjectId[projectId] : undefined,
  );
  const recordRef = useRef(record);

  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  useEffect(() => {
    if (!projectId) return;
    void dispatch(loadProjectFiles(projectId));
  }, [dispatch, projectId]);

  const files = useMemo(
    () =>
      Object.values(record?.files ?? {}).sort((a, b) =>
        a.filename.localeCompare(b.filename),
      ),
    [record?.files],
  );

  const openFiles = useMemo(
    () =>
      (record?.openFileIds ?? [])
        .map((id) => record?.files[id])
        .filter(Boolean) as EditorFileState[],
    [record?.files, record?.openFileIds],
  );

  const activeFile = record?.activeFileId
    ? record?.files[record.activeFileId] ?? undefined
    : undefined;

  const loading = record?.status === "loading";
  const error =
    projectId === undefined || projectId === null
      ? "Select a project to load files."
      : record?.error ?? null;
  const hasUnsavedChanges = openFiles.some((file) => file.dirty);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    await dispatch(loadProjectFiles(projectId));
  }, [dispatch, projectId]);

  const openFileCb = useCallback(
    (fileId: number) => {
      if (!projectId) return;
      dispatch(openFileAction({ projectId, fileId }));
    },
    [dispatch, projectId],
  );

  const closeFileCb = useCallback(
    (fileId: number) => {
      if (!projectId) return;
      dispatch(closeFileAction({ projectId, fileId }));
    },
    [dispatch, projectId],
  );

  const selectFile = useCallback(
    (fileId: number) => {
      if (!projectId) return;
      dispatch(setActiveFileAction({ projectId, fileId }));
    },
    [dispatch, projectId],
  );

  const updateDraftCb = useCallback(
    (fileId: number, value: string | undefined) => {
      if (!projectId) return;
      const nextValue = value ?? "";
      dispatch(updateFileDraft({ projectId, fileId, draftContent: nextValue }));
    },
    [dispatch, projectId],
  );

  const saveFileCb = useCallback(
    async (fileId: number) => {
      if (!projectId) return false;
      const current = recordRef.current?.files[fileId];
      if (!current) return false;
      if (!current.dirty && current.saveError === null) return true;

      dispatch(markFileSaving({ projectId, fileId, saving: true }));

      try {
        const updated = await dispatch(
          saveFileThunk({ fileId, content: current.draftContent ?? "" }),
        ).unwrap();
        dispatch(
          markFileSaved({
            projectId,
            fileId,
            content: updated.content ?? "",
            metadata: {
              filename: updated.filename ?? current.filename,
              file_type: updated.file_type ?? current.file_type,
              updated_at: updated.updated_at ?? current.updated_at,
            },
          }),
        );
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save file.";
        dispatch(setFileError({ projectId, fileId, error: message }));
        return false;
      }
    },
    [dispatch, projectId],
  );

  const createFileCb = useCallback(
    async (input: { filename: string; content?: string }) => {
      if (!projectId) throw new Error("Select a project before creating files.");
      if (!currentUserId) throw new Error("You need to be logged in to create files.");

      const trimmedName = input.filename.trim();
      if (!trimmedName) throw new Error("Filename is required.");

      const created = await dispatch(
        createFileThunk({
          projectId,
          currentUserId,
          filename: trimmedName,
          content: input.content ?? "",
        }),
      ).unwrap();
      const newFileState: EditorFileState = {
        ...created.file,
        draftContent: created.file.content ?? "",
        dirty: false,
        saving: false,
        saveError: null,
      };
      dispatch(addFile({ projectId, file: newFileState }));
      return newFileState;
    },
    [currentUserId, dispatch, projectId],
  );

  const syncFileContent = useCallback(
    (fileId: number, content: string, markClean = false) => {
      if (!projectId) return;
      dispatch(
        syncFileContentAction({
          projectId,
          fileId,
          content,
          markClean,
        }),
      );
    },
    [dispatch, projectId],
  );

  const deleteFileCb = useCallback(
    async (fileId: number) => {
      if (!projectId) return;
      await dispatch(deleteFileThunk({ projectId, fileId })).unwrap();
      dispatch(removeFile({ projectId, fileId }));
    },
    [dispatch, projectId],
  );

  return {
    files,
    openFiles,
    activeFile,
    loading,
    error,
    hasUnsavedChanges,
    openFile: openFileCb,
    closeFile: closeFileCb,
    selectFile,
    updateDraft: updateDraftCb,
    saveFile: saveFileCb,
    refresh,
    createFile: createFileCb,
    syncFileContent,
    deleteFile: deleteFileCb,
  };
}

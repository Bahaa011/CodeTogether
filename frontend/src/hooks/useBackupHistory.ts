/**
 * useBackupHistory Hook
 *
 * Manages fetching, displaying, and interacting with file backup versions.
 * Designed for use in both modal and panel contexts (e.g., BackupHistoryModal).
 *
 * Responsibilities:
 * - Load a file's historical backups from the backend (via GraphQL).
 * - Track the selected backup and its metadata.
 * - Provide a helper to preview a backup’s contents in a new tab.
 * - Expose a reactive "state" descriptor (loading, error, empty, etc.).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { type VersionRecord } from "../graphql/version.api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadBackupsForFile } from "../store/backupsSlice";

/**
 * UseBackupHistoryOptions
 *
 * Configurable options for the useBackupHistory hook.
 *
 * - fileId: The ID of the file whose backups should be fetched.
 * - variant: Determines rendering behavior ("modal" | "panel").
 *   • modal → data is fetched only when modal opens.
 *   • panel → data is fetched when fileId is available.
 * - open: Whether the modal is currently open (relevant only if variant = "modal").
 */
type UseBackupHistoryOptions = {
  fileId?: number | null;
  variant?: "modal" | "panel";
  open?: boolean;
};

/**
 * useBackupHistory
 *
 * Handles backup retrieval, selection, and preview logic for a given file.
 *
 * Returns:
 * - backups: Array of backup version records.
 * - loading: Whether backups are being fetched.
 * - error: Optional error message if fetching fails.
 * - selectedId: ID of the currently selected backup.
 * - setSelectedId: State setter to update selected backup manually.
 * - selectedBackup: Full object of the selected version.
 * - handleViewBackup: Opens selected backup content in a new browser tab.
 * - backupListState: Derived UI-friendly state string ("loading", "ready", etc.).
 */
export function useBackupHistory({
  fileId,
  variant = "modal",
  open = false,
}: UseBackupHistoryOptions) {
  const isPanel = variant === "panel";
  const dispatch = useAppDispatch();
  const record = useAppSelector((state) =>
    fileId ? state.backups.byFileId[fileId] : undefined,
  );
  const emptyBackups = useMemo<VersionRecord[]>(() => [], []);
  const backups = record?.list ?? emptyBackups;
  const loading = record?.status === "loading";
  const error = record?.error ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const shouldLoad = Boolean(fileId) && (isPanel ? Boolean(fileId) : open);

  useEffect(() => {
    if (!fileId || !shouldLoad) {
      setSelectedId(null);
      return;
    }

    void dispatch(loadBackupsForFile(fileId));
  }, [dispatch, fileId, shouldLoad]);

  useEffect(() => {
    if (!backups.length) {
      setSelectedId(null);
      return;
    }
    if (selectedId && backups.some((backup) => backup.id === selectedId)) {
      return;
    }
    setSelectedId(backups[0]?.id ?? null);
  }, [backups, selectedId]);

  // Derived State & Helpers
  const selectedBackup = useMemo(
    () => backups.find((backup) => backup.id === selectedId) ?? null,
    [backups, selectedId],
  );

  /**
   * Opens the selected backup’s contents in a new browser tab
   * as a temporary object URL.
   */
  const handleViewBackup = useCallback(() => {
    if (!selectedBackup) return;

    const blob = new Blob([selectedBackup.content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");

    // Revoke object URL after 60 seconds to free memory
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  }, [selectedBackup]);

  /**
   * Derived descriptor for the UI:
   * - "no-file" → No file selected.
   * - "loading" → Fetching backups.
   * - "error" → Fetch failed.
   * - "empty" → No backups exist.
   * - "ready" → Backups successfully loaded.
   */
  const backupListState = useMemo(() => {
    if (!fileId) return "no-file";
    if (loading) return "loading";
    if (error) return "error";
    if (!backups.length) return "empty";
    return "ready";
  }, [backups.length, error, fileId, loading]);

  // Return API
  return {
    backups,
    loading,
    error,
    selectedId,
    setSelectedId,
    selectedBackup,
    handleViewBackup,
    backupListState,
  };
}

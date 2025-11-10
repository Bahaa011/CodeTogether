/**
 * useBackupHistory Hook
 *
 * Manages fetching, displaying, and interacting with file backup versions.
 * Designed for use in both modal and panel contexts (e.g., BackupHistoryModal).
 *
 * Responsibilities:
 * - Load a file's historical backups from the backend (via versionService).
 * - Track the selected backup and its metadata.
 * - Provide a helper to preview a backup’s contents in a new tab.
 * - Expose a reactive "state" descriptor (loading, error, empty, etc.).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchFileBackups,
  type VersionRecord,
} from "../services/versionService";

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

  // State
  const [backups, setBackups] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Data Fetch Logic
  useEffect(() => {
    const shouldLoad = isPanel ? Boolean(fileId) : open;
    if (!shouldLoad) return;

    let cancelled = false;

    const loadBackups = async (targetFileId: number) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchFileBackups(targetFileId);
        if (cancelled) return;

        setBackups(data);
        setSelectedId(data[0]?.id ?? null);
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : "Unable to load backups.";
        setError(message);
        setBackups([]);
        setSelectedId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (fileId) {
      void loadBackups(fileId);
    } else {
      setBackups([]);
      setSelectedId(null);
    }

    return () => {
      cancelled = true;
    };
  }, [fileId, isPanel, open]);

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

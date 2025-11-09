import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchFileBackups,
  type VersionRecord,
} from "../services/versionService";

type UseBackupHistoryOptions = {
  fileId?: number | null;
  variant?: "modal" | "panel";
  open?: boolean;
};

export function useBackupHistory({
  fileId,
  variant = "modal",
  open = false,
}: UseBackupHistoryOptions) {
  const isPanel = variant === "panel";
  const [backups, setBackups] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
        if (!cancelled) {
          setLoading(false);
        }
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

  const selectedBackup = useMemo(
    () => backups.find((backup) => backup.id === selectedId) ?? null,
    [backups, selectedId],
  );

  const handleViewBackup = useCallback(() => {
    if (!selectedBackup) {
      return;
    }

    const blob = new Blob([selectedBackup.content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  }, [selectedBackup]);

  const backupListState = useMemo(() => {
    if (!fileId) {
      return "no-file";
    }
    if (loading) return "loading";
    if (error) return "error";
    if (!backups.length) return "empty";
    return "ready";
  }, [backups.length, error, fileId, loading]);

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

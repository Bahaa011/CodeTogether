import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import {
  fetchFileBackups,
  type VersionRecord,
} from "../services/versionService";
import "../styles/backup-history.css";

type BackupHistoryProps = {
  fileId?: number | null;
  variant?: "modal" | "panel";
  open?: boolean;
  onClose?(): void;
  emptyMessage?: string;
};

export default function BackupHistoryModal(props: BackupHistoryProps) {
  const {
    fileId,
    variant = "modal",
    open = false,
    onClose,
    emptyMessage,
  } = props;
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

  const backupListState = (() => {
    if (!fileId) {
      return "no-file";
    }
    if (loading) return "loading";
    if (error) return "error";
    if (!backups.length) return "empty";
    return "ready";
  })();

  const content = (
    <div className="backup-history-wrapper">
      <div className="backup-history">
        <div className="backup-history__list">
          {backupListState === "no-file" && (
            <p className="backup-history__status">
              Select a file to view its backups.
            </p>
          )}
          {backupListState === "loading" && (
            <p className="backup-history__status">Loading backups…</p>
          )}
          {backupListState === "error" && (
            <p className="backup-history__status backup-history__status--error">
              {error}
            </p>
          )}
          {backupListState === "empty" && (
            <p className="backup-history__status">
              No backups have been created yet.
            </p>
          )}
          {backupListState === "ready" && (
            <ul className="backup-history__items">
              {backups.map((backup) => {
                const createdAt = new Date(backup.created_at).toLocaleString();
                const owner =
                  backup.user?.username ||
                  backup.user?.email ||
                  (backup.user?.id ? `User #${backup.user.id}` : "Unknown");

                const isSelected = backup.id === selectedId;

                return (
                  <li key={backup.id}>
                    <button
                      type="button"
                      className={
                        isSelected
                          ? "backup-history__item backup-history__item--active"
                          : "backup-history__item"
                      }
                      onClick={() => setSelectedId(backup.id)}
                    >
                      <span className="backup-history__item-title">
                        Version #{backup.version_number}
                      </span>
                      <span className="backup-history__item-meta">
                        {createdAt} · {owner}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="backup-history__details">
          {selectedBackup ? (
            <>
              <header className="backup-history__details-header">
                <div>
                  <h3>Version #{selectedBackup.version_number}</h3>
                  <p>
                    Saved{" "}
                    {new Date(selectedBackup.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedBackup.user && (
                  <span className="backup-history__badge">
                    {selectedBackup.user.username ||
                      selectedBackup.user.email ||
                      (selectedBackup.user.id
                        ? `User #${selectedBackup.user.id}`
                        : "Unknown user")}
                  </span>
                )}
              </header>
              <p className="backup-history__instructions">
                Open this backup in a separate viewer to inspect or compare its
                contents without leaving your current workspace.
              </p>
              <button
                type="button"
                className="backup-history__view"
                onClick={handleViewBackup}
              >
                View backup contents
              </button>
            </>
          ) : (
            <p className="backup-history__status">
              {backupListState === "ready"
                ? "Select a backup to view its contents."
                : emptyMessage ?? "No backup selected."}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (isPanel) {
    return content;
  }

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={onClose ?? (() => undefined)} title="File Backups">
      {content}
    </Modal>
  );
}

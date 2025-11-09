import { useMemo, useState } from "react";
import Modal from "./Modal";
import { useBackupHistory } from "../../hooks/useBackupHistory";
import ConfirmationDialog from "./ConfirmationDialog";
import "../../styles/backup-history.css";

type BackupHistoryProps = {
  fileId?: number | null;
  variant?: "modal" | "panel";
  open?: boolean;
  onClose?(): void;
  emptyMessage?: string;
  onRevert?(versionId: number): void;
  revertingVersionId?: number | null;
};

export default function BackupHistoryModal(props: BackupHistoryProps) {
  const {
    fileId,
    variant = "modal",
    open = false,
    onClose,
    emptyMessage,
    onRevert,
    revertingVersionId = null,
  } = props;
  const isPanel = variant === "panel";
  const {
    backups,
    error,
    selectedId,
    setSelectedId,
    selectedBackup,
    handleViewBackup,
    backupListState,
  } = useBackupHistory({ fileId, variant, open });
  const [pendingVersionId, setPendingVersionId] = useState<number | null>(null);
  const pendingBackup = useMemo(
    () => backups.find((backup) => backup.id === pendingVersionId),
    [backups, pendingVersionId],
  );

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
                        {backup.label?.length
                          ? backup.label
                          : `Version #${backup.version_number}`}
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
                  <h3>
                    {selectedBackup.label?.length
                      ? selectedBackup.label
                      : `Version #${selectedBackup.version_number}`}
                  </h3>
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
              {onRevert && (
                <button
                  type="button"
                  className="backup-history__view backup-history__view--secondary"
                  onClick={() => {
                    if (
                      revertingVersionId &&
                      revertingVersionId !== selectedBackup.id
                    ) {
                      return;
                    }
                    setPendingVersionId(selectedBackup.id);
                  }}
                  disabled={
                    Boolean(
                      revertingVersionId &&
                        revertingVersionId !== selectedBackup.id,
                    )
                  }
                >
                  {revertingVersionId === selectedBackup.id
                    ? "Reverting…"
                    : "Revert to this backup"}
                </button>
              )}
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

  const dialogMessage = pendingBackup
    ? `Replace the current file with ${
        pendingBackup.label?.length
          ? pendingBackup.label
          : `Version #${pendingBackup.version_number}`
      }? This cannot be undone.`
    : "";

  const confirmDialog = (
    <ConfirmationDialog
      open={Boolean(pendingBackup)}
      mode="confirm"
      tone="danger"
      title="Revert to backup"
      message={dialogMessage}
      confirmLabel="Revert"
      cancelLabel="Cancel"
      onCancel={() => setPendingVersionId(null)}
      onConfirm={() => {
        if (pendingVersionId && onRevert) {
          onRevert(pendingVersionId);
        }
        setPendingVersionId(null);
      }}
    />
  );

  if (isPanel) {
    return (
      <>
        {content}
        {confirmDialog}
      </>
    );
  }

  if (!open) {
    return confirmDialog;
  }

  return (
    <>
      <Modal open={open} onClose={onClose ?? (() => undefined)} title="File Backups">
        {content}
      </Modal>
      {confirmDialog}
    </>
  );
}

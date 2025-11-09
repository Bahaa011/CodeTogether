import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import BackupHistoryModal from "./BackupHistoryModal";
import ConfirmationDialog from "./ConfirmationDialog";
import type { Project } from "../../services/projectService";
import TagSelect from "../TagSelect";
import { useProjectSettingsModal } from "../../hooks/useProjectSettingsModal";
import type { CollaboratorRecord } from "../../services/collaboratorService";
import "../../styles/project-settings.css";

type ProjectSettingsModalProps = {
  open: boolean;
  project: Project | null;
  canEdit: boolean;
  activeFileId?: number | null;
  canDeleteProject?: boolean;
  onClose(): void;
  onProjectUpdated(project: Project): void;
  onProjectDeleted?(): void;
  onRevertBackup(versionId: number, fileId?: number | null): void;
  revertingVersionId: number | null;
};

export default function ProjectSettingsModal({
  open,
  project,
  canEdit,
  activeFileId,
  canDeleteProject = false,
  onClose,
  onProjectUpdated,
  onProjectDeleted,
  onRevertBackup,
  revertingVersionId,
}: ProjectSettingsModalProps) {
  const {
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    selectedTags,
    setSelectedTags,
    saving,
    statusMessage,
    statusTone,
    collaborators,
    collaboratorsLoading,
    collaboratorsError,
    collaboratorAction,
    detailsChanged,
    handleSubmit,
    handleRemoveCollaborator,
    handleDeleteProject,
    deletingProject,
    deleteProjectError,
  } = useProjectSettingsModal({
    open,
    project,
    canEdit,
    onProjectUpdated,
  });

  const [pendingRemoval, setPendingRemoval] = useState<CollaboratorRecord | null>(null);
  const collaboratorName = useMemo(() => {
    if (!pendingRemoval) {
      return "this collaborator";
    }
    return (
      pendingRemoval.user?.username ??
      pendingRemoval.user?.email ??
      `User #${pendingRemoval.user?.id ?? pendingRemoval.id}`
    );
  }, [pendingRemoval]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setDeleteDialogOpen(false);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Workspace Settings"
      className="modal--wide"
    >
      <div className="project-settings">
        <div className="project-settings__tabs-row">
          <button
            type="button"
            className={
              activeTab === "details"
                ? "project-settings__tab project-settings__tab--active"
                : "project-settings__tab"
            }
            onClick={() => setActiveTab("details")}
          >
            <div>
              <strong>Project details</strong>
              <span>Update title, description, visibility</span>
            </div>
          </button>
          <button
            type="button"
            className={
              activeTab === "backups"
                ? "project-settings__tab project-settings__tab--active"
                : "project-settings__tab"
            }
            onClick={() => setActiveTab("backups")}
          >
            <div>
              <strong>Backups</strong>
              <span>Browse saved file versions</span>
            </div>
          </button>
          <button
            type="button"
            className={
              activeTab === "collaborators"
                ? "project-settings__tab project-settings__tab--active"
                : "project-settings__tab"
            }
            onClick={() => setActiveTab("collaborators")}
          >
            <div>
              <strong>Collaborators</strong>
              <span>Manage team access</span>
            </div>
          </button>
        </div>

        <section className="project-settings__panel-area">
          {activeTab === "details" && project ? (
            <form className="project-settings__form" onSubmit={handleSubmit}>
              <div className="project-settings__grid">
                <div className="project-settings__section project-settings__section--compact">
                  <label className="project-settings__field">
                    <span>Title</span>
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      disabled={!canEdit}
                      required
                    />
                  </label>
                  <div className="project-settings__field">
                    <span>Visibility</span>
                    <label className="project-settings__checkbox">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(event) => setIsPublic(event.target.checked)}
                        disabled={!canEdit}
                      />
                      <span>Make project public</span>
                    </label>
                  </div>
                </div>

                <div className="project-settings__section project-settings__section--compact">
                  <div className="project-settings__field project-settings__field--tags">
                    <TagSelect
                      selectedTags={selectedTags}
                      onChange={setSelectedTags}
                      disabled={!canEdit}
                      label="Tags"
                    />
                  </div>
                </div>
              </div>

              <div className="project-settings__section project-settings__section--full">
                <label className="project-settings__field">
                  <span>Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    disabled={!canEdit}
                  />
                </label>
              </div>

              {statusMessage && (
                <p
                  className={
                    statusTone === "error"
                      ? "project-settings__status project-settings__status--error"
                      : "project-settings__status"
                  }
                >
                  {statusMessage}
                </p>
              )}

              <div
                className={
                  canDeleteProject
                    ? "project-settings__actions project-settings__actions--split"
                    : "project-settings__actions"
                }
              >
                {canDeleteProject && (
                  <div className="project-settings__danger-inline">
                    <div className="project-settings__danger-copy">
                      <strong>Danger zone</strong>
                      <span>Delete project permanently</span>
                      {deleteProjectError && (
                        <p className="project-settings__status project-settings__status--error">
                          {deleteProjectError}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="project-settings__delete"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={deletingProject}
                    >
                      {deletingProject ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  className="project-settings__save"
                  disabled={!canEdit || !detailsChanged || saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === "details" && !project && (
            <p className="project-settings__placeholder">
              Project details are still loading. Try again shortly.
            </p>
          )}

          {activeTab === "backups" && (
            <div className="project-settings__panel">
              <BackupHistoryModal
                variant="panel"
                fileId={activeFileId}
                onRevert={(versionId) => onRevertBackup(versionId, activeFileId)}
                revertingVersionId={revertingVersionId}
                emptyMessage="Choose a file in the editor to view its backups."
              />
            </div>
          )}

          {activeTab === "collaborators" && (
            <div className="project-settings__panel">
              <div className="project-settings__collab-header">
                <div>
                  <h3>Project collaborators</h3>
                  <p>Invite teammates or remove access.</p>
                </div>
                <button
                  type="button"
                  className="project-settings__save"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("invite-collaborator"));
                    }
                  }}
                >
                  Add collaborator
                </button>
              </div>

              {collaboratorsLoading ? (
                <p className="project-settings__status">Loading collaborators…</p>
              ) : collaboratorsError ? (
                <p className="project-settings__status project-settings__status--error">
                  Unable to load collaborators. Please try again shortly.
                </p>
              ) : collaborators.length === 0 ? (
                <div className="project-settings__empty">
                  <p>No collaborators yet.</p>
                  <p className="project-settings__empty-sub">
                    Invite teammates so everyone stays in sync.
                  </p>
                </div>
              ) : (
                <ul className="project-settings__collab-list">
                  {collaborators.map((record) => (
                    <li key={record.id} className="project-settings__collab-item">
                      <div>
                        <strong>
                          {record.user?.username ??
                            record.user?.email ??
                            `User #${record.user?.id ?? record.id}`}
                        </strong>
                        <span>{record.user?.email ?? "No email provided"}</span>
                      </div>
                      <button
                        type="button"
                        className="project-settings__collab-remove"
                        onClick={() => setPendingRemoval(record)}
                        disabled={collaboratorsLoading}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {collaboratorAction && (
                <p className="project-settings__status">{collaboratorAction}</p>
              )}
            </div>
          )}
        </section>
      </div>
      <ConfirmationDialog
        open={Boolean(pendingRemoval)}
        mode="confirm"
        tone="danger"
        title="Remove collaborator"
        message={`Remove ${collaboratorName}? They will immediately lose access.`}
        confirmLabel="Remove"
        cancelLabel="Keep access"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (!pendingRemoval) return;
          void handleRemoveCollaborator(pendingRemoval);
          setPendingRemoval(null);
        }}
      />
      {canDeleteProject && (
        <ConfirmationDialog
          open={deleteDialogOpen}
          mode="confirm"
          tone="danger"
          title="Delete project"
          message="This will permanently remove the project for everyone."
          confirmLabel="Delete project"
          cancelLabel="Cancel"
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={async () => {
            try {
              await handleDeleteProject();
              setDeleteDialogOpen(false);
              onProjectDeleted?.();
            } catch (error) {
              // errors surfaced via deleteProjectError
            }
          }}
        />
      )}
    </Modal>
  );
}

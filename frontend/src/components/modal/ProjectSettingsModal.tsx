/**
 * ProjectSettingsModal Component
 * -------------------------------
 * A full-featured modal dialog that allows users to manage all key aspects
 * of a project’s configuration, including metadata, visibility, tags,
 * collaborators, backups, and deletion.
 *
 * Responsibilities:
 * - Display tabbed sections for:
 *   1. Project details (title, visibility, description, tags)
 *   2. Backups (version history per file)
 *   3. Collaborators (invite/remove users)
 * - Handle save operations, collaborator removals, and project deletion.
 * - Integrate seamlessly with nested modals (ConfirmationDialog, BackupHistoryModal).
 *
 * Context:
 * This modal is typically opened from the Project Workspace view (Editor),
 * providing inline access to project management tools.
 */

import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import BackupHistoryModal from "./BackupHistoryModal";
import ConfirmationDialog from "./ConfirmationDialog";
import type { Project } from "../../services/projectService";
import TagSelect from "../TagSelect";
import { useProjectSettingsModal } from "../../hooks/useProjectSettingsModal";
import type { CollaboratorRecord } from "../../services/collaboratorService";
import "../../styles/project-settings.css";

/**
 * ProjectSettingsModalProps
 * --------------------------
 * Props accepted by the ProjectSettingsModal component.
 *
 * - open: Whether the modal is currently visible.
 * - project: The project object being edited.
 * - canEdit: Whether the current user can modify project details.
 * - activeFileId: ID of the file currently open in the editor (for backups).
 * - canDeleteProject: Enables deletion section (if the user owns the project).
 * - onClose: Called when modal is dismissed.
 * - onProjectUpdated: Fired after saving project updates.
 * - onProjectDeleted: Fired after successful deletion.
 * - onRevertBackup: Handles file version reversion.
 * - revertingVersionId: Currently reverting version, if any.
 */
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

/**
 * ProjectSettingsModal
 * ---------------------
 * Provides a tabbed interface for managing a project's configuration and members.
 * Integrates hooks, nested modals, and service logic to handle updates, deletion,
 * and collaborator access changes.
 */
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
  /**
   * Hook: useProjectSettingsModal
   * ------------------------------
   * Centralized state and logic handler for:
   * - Title, description, visibility, and tags.
   * - Collaborator fetching and mutation.
   * - Save and delete project actions.
   * - Status messages and tones.
   */
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

  // Track currently pending collaborator removal for confirmation
  const [pendingRemoval, setPendingRemoval] = useState<CollaboratorRecord | null>(null);
  const collaboratorName = useMemo(() => {
    if (!pendingRemoval) return "this collaborator";
    return (
      pendingRemoval.user?.username ??
      pendingRemoval.user?.email ??
      `User #${pendingRemoval.user?.id ?? pendingRemoval.id}`
    );
  }, [pendingRemoval]);

  // Track delete project confirmation modal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Reset delete dialog when modal closes
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
        {/* ---------------- Tabs Navigation ---------------- */}
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

        {/* ---------------- Active Tab Content ---------------- */}
        <section className="project-settings__panel-area">
          {/* ===== Tab: DETAILS ===== */}
          {activeTab === "details" && project ? (
            <form className="project-settings__form" onSubmit={handleSubmit}>
              <div className="project-settings__grid">
                {/* ---- Basic Fields ---- */}
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

                {/* ---- Tags ---- */}
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

              {/* ---- Description ---- */}
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

              {/* ---- Status Message ---- */}
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

              {/* ---- Save / Delete Actions ---- */}
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

          {/* ===== Tab: BACKUPS ===== */}
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

          {/* ===== Tab: COLLABORATORS ===== */}
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

              {/* ---- Collaborator States ---- */}
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

      {/* ---------------- Nested Modals ---------------- */}

      {/* Confirm collaborator removal */}
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

      {/* Confirm project deletion */}
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
            } catch {
              // Error displayed via deleteProjectError
            }
          }}
        />
      )}
    </Modal>
  );
}

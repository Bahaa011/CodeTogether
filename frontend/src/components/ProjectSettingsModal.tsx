import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import BackupHistoryModal from "./BackupHistoryModal";
import { updateProject, type Project } from "../services/projectService";
import { fetchCollaboratorsByProject, removeCollaborator, type CollaboratorRecord } from "../services/collaboratorsAdminService";
import "../styles/project-settings.css";

type ProjectSettingsModalProps = {
  open: boolean;
  project: Project | null;
  canEdit: boolean;
  activeFileId?: number | null;
  onClose(): void;
  onProjectUpdated(project: Project): void;
};

type TabId = "details" | "backups" | "collaborators";

export default function ProjectSettingsModal({
  open,
  project,
  canEdit,
  activeFileId,
  onClose,
  onProjectUpdated,
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "error">("info");
  const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>([]);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [collaboratorsError, setCollaboratorsError] = useState<string | null>(null);
  const [collaboratorAction, setCollaboratorAction] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveTab("details");
    setStatusMessage(null);
  }, [open]);

  useEffect(() => {
    if (!project) {
      setTitle("");
      setDescription("");
      setIsPublic(false);
      return;
    }
    setTitle(project.title ?? "");
    setDescription(project.description ?? "");
    setIsPublic(Boolean(project.is_public));
  }, [project]);

  useEffect(() => {
    if (!project?.id || activeTab !== "collaborators") {
      return;
    }

    let cancelled = false;
    setCollaboratorsLoading(true);
    setCollaboratorsError(null);
    setCollaboratorAction(null);

    const load = async () => {
      try {
        const data = await fetchCollaboratorsByProject(project.id);
        if (cancelled) return;
        setCollaborators(data);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Unable to load collaborators.";
        setCollaboratorsError(message);
        setCollaborators([]);
      } finally {
        if (!cancelled) {
          setCollaboratorsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeTab, project?.id]);

  const detailsChanged = useMemo(() => {
    if (!project) return false;
    return (
      title.trim() !== (project.title ?? "").trim() ||
      description.trim() !== (project.description ?? "").trim() ||
      Boolean(isPublic) !== Boolean(project.is_public)
    );
  }, [description, isPublic, project, title]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project || !detailsChanged || !canEdit) {
      return;
    }
    setSaving(true);
    setStatusMessage(null);

    try {
      const updated = await updateProject(project.id, {
        title: title.trim(),
        description: description.trim(),
        is_public: isPublic,
      });
      onProjectUpdated(updated);
      setStatusTone("info");
      setStatusMessage("Project details updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update project.";
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCollaborator = async (record: CollaboratorRecord) => {
    if (!record.id) {
      return;
    }
    setCollaboratorAction(null);
    try {
      await removeCollaborator(record.id);
      setCollaborators((prev) => prev.filter((item) => item.id !== record.id));
      setCollaboratorAction(`Removed ${record.user?.username ?? record.user?.email ?? "collaborator"}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to remove collaborator.";
      setCollaboratorAction(message);
    }
  };

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
              <div className="project-settings__section">
                <h3>Project identity</h3>
                <p>
                  These details appear across the app wherever your project is
                  referenced.
                </p>
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

              <div className="project-settings__section">
                <h3>Visibility</h3>
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

              <div className="project-settings__actions">
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
                        onClick={() => handleRemoveCollaborator(record)}
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
    </Modal>
  );
}

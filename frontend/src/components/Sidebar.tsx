// Sidebar.tsx
import type { EditorFileState } from "../hooks/useProjectEditor";
import { resolveAssetUrl } from "../utils/url";

export type SidebarCollaborator = {
  id: string | number;
  name: string;
  status?: "online" | "away" | "offline";
  color?: string;
  avatarUrl?: string | null;
};

type SidebarProps = {
  files: EditorFileState[];
  activeFileId: number | null;
  loading: boolean;
  error: string | null;
  onSelect(fileId: number): void;
  onRefresh(): void;
  onCreateFile?(): void;
  canCreateFiles?: boolean;
  onDeleteFile?(fileId: number): void;
  canDeleteFiles?: boolean;
  projectTitle?: string;
  collaborators?: SidebarCollaborator[];
};

const STATUS_CLASS: Record<
  NonNullable<SidebarCollaborator["status"]>,
  string
> = {
  online: "workspace-sidebar__presence-dot--online",
  away: "workspace-sidebar__presence-dot--away",
  offline: "workspace-sidebar__presence-dot--offline",
};

export default function Sidebar({
  files,
  activeFileId,
  loading,
  error,
  onSelect,
  onRefresh,
  onCreateFile,
  canCreateFiles = true,
  onDeleteFile,
  canDeleteFiles = true,
  projectTitle,
  collaborators = [],
}: SidebarProps) {
  const onlineCount = collaborators.filter(
    (collab) => collab.status !== "offline",
  ).length;

  return (
    <aside className="workspace-sidebar">
      <section className="workspace-sidebar__section workspace-sidebar__section--explorer">
        <header className="workspace-sidebar__section-header">
          <div>
            <p className="workspace-sidebar__section-title">Explorer</p>
            <p className="workspace-sidebar__section-subtitle">
              {projectTitle || "Workspace"}
            </p>
          </div>
          <div className="workspace-sidebar__actions">
            {onCreateFile && (
              <button
                type="button"
                onClick={onCreateFile}
                disabled={!canCreateFiles}
                aria-label="Create file"
                className="workspace-sidebar__action workspace-sidebar__action--primary"
              >
                +
              </button>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh files"
              className="workspace-sidebar__action"
            >
              ↻
            </button>
          </div>
        </header>

        <div className="workspace-sidebar__tree">
          <div className="workspace-sidebar__folder">
            <span className="workspace-sidebar__folder-icon">▾</span>
            <span className="workspace-sidebar__folder-name">src</span>
          </div>

          <div className="workspace-sidebar__files">
            {loading && (
              <p className="workspace-sidebar__hint">Loading project files…</p>
            )}

            {!loading && error && (
              <p className="workspace-sidebar__hint workspace-sidebar__hint--error">
                {error}
              </p>
            )}

            {!loading && !error && files.length === 0 && (
              <p className="workspace-sidebar__hint">
                This project has no files yet.
              </p>
            )}

            {!loading && !error && files.length > 0 && (
              <ul className="workspace-sidebar__file-list">
                {files.map((file) => {
                  const isActive = file.id === activeFileId;
                  const itemClass = isActive
                    ? "workspace-sidebar__file workspace-sidebar__file--active"
                    : "workspace-sidebar__file";

                  return (
                    <li key={file.id} className="workspace-sidebar__file-row">
                      <button
                        type="button"
                        onClick={() => onSelect(file.id)}
                        className={itemClass}
                      >
                        <span
                          className="workspace-sidebar__file-icon"
                          aria-hidden="true"
                        />
                        <span className="workspace-sidebar__file-name">
                          {file.filename}
                        </span>
                      </button>
                      {onDeleteFile && canDeleteFiles && (
                        <button
                          type="button"
                          className="workspace-sidebar__file-delete"
                          aria-label={`Delete ${file.filename}`}
                          title={`Delete ${file.filename}`}
                          onClick={() => onDeleteFile(file.id)}
                        >
                          <span aria-hidden="true">🗑</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="workspace-sidebar__section workspace-sidebar__section--collaborators">
        <header className="workspace-sidebar__section-header">
          <div>
            <p className="workspace-sidebar__section-title">
              Live Collaborators
            </p>
            <p className="workspace-sidebar__section-subtitle">
              {onlineCount} online
            </p>
          </div>
        </header>

        <ul className="workspace-sidebar__collaborators">
          {collaborators.length === 0 && (
            <li className="workspace-sidebar__hint">
              No collaborators connected.
            </li>
          )}

          {collaborators.map((collaborator) => {
            const statusClass =
              STATUS_CLASS[collaborator.status ?? "offline"] ??
              STATUS_CLASS.offline;
            const avatarImage = resolveAssetUrl(collaborator.avatarUrl);
            const avatarClassName = avatarImage
              ? "workspace-sidebar__avatar workspace-sidebar__avatar--image"
              : "workspace-sidebar__avatar";

            return (
              <li key={collaborator.id} className="workspace-sidebar__collab">
                <span
                  className={avatarClassName}
                  style={
                    !avatarImage && collaborator.color
                      ? { backgroundColor: collaborator.color }
                      : undefined
                  }
                >
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt={collaborator.name}
                      loading="lazy"
                    />
                  ) : (
                    collaborator.name.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="workspace-sidebar__collab-info">
                  <span className="workspace-sidebar__collab-name">
                    {collaborator.name}
                  </span>
                  <span className="workspace-sidebar__presence">
                    <span
                      className={`workspace-sidebar__presence-dot ${statusClass}`}
                    />
                    {collaborator.status ?? "offline"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}

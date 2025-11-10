/**
 * Sidebar Component
 * ------------------
 * Displays the project explorer and live collaborator list in the workspace.
 *
 * Responsibilities:
 * - Show project files with options to open, refresh, create, or delete.
 * - Reflect active file highlighting within the workspace.
 * - Display real-time collaborator presence and avatars.
 * - Handle UI states for loading, error, and empty conditions.
 *
 * Context:
 * Used alongside FileTabs and CodeEditor in ProjectView to manage navigation.
 */

import type { EditorFileState } from "../../hooks/useProjectEditor";
import { resolveAssetUrl } from "../../utils/url";

/**
 * SidebarCollaborator
 * --------------------
 * Represents a single active (or offline) collaborator in the workspace.
 *
 * Fields:
 * - id: Unique collaborator identifier.
 * - name: Display name of the user.
 * - status: Current presence ("online" | "away" | "offline").
 * - color: Optional color for avatar background.
 * - avatarUrl: Optional image path for collaborator profile picture.
 */
export type SidebarCollaborator = {
  id: string | number;
  name: string;
  status?: "online" | "away" | "offline";
  color?: string;
  avatarUrl?: string | null;
};

/**
 * SidebarProps
 * --------------
 * Props accepted by the Sidebar component.
 *
 * - files: Array of current project files (from editor state).
 * - activeFileId: ID of currently selected file.
 * - loading: Whether files are being fetched.
 * - error: Error message if file retrieval fails.
 * - onSelect: Called when a file is clicked.
 * - onRefresh: Triggered when user refreshes the file list.
 * - onCreateFile: Optional handler for file creation.
 * - canCreateFiles: Permission toggle for file creation.
 * - onDeleteFile: Optional handler for file deletion.
 * - canDeleteFiles: Permission toggle for file deletion.
 * - projectTitle: Optional project name displayed at top.
 * - collaborators: Active collaborator list with presence indicators.
 */
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

/**
 * STATUS_CLASS
 * -------------
 * Maps collaborator status to CSS presence dot modifiers.
 */
const STATUS_CLASS: Record<
  NonNullable<SidebarCollaborator["status"]>,
  string
> = {
  online: "workspace-sidebar__presence-dot--online",
  away: "workspace-sidebar__presence-dot--away",
  offline: "workspace-sidebar__presence-dot--offline",
};

/**
 * Sidebar
 * ---------
 * Renders the file explorer and live collaborators list.
 * Handles both file management and presence visibility logic.
 */
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
  /** Count collaborators who are not offline */
  const onlineCount = collaborators.filter(
    (collab) => collab.status !== "offline",
  ).length;

  return (
    <aside className="workspace-sidebar">
      {/* ---------------- File Explorer Section ---------------- */}
      <section className="workspace-sidebar__section workspace-sidebar__section--explorer">
        <header className="workspace-sidebar__section-header">
          <div>
            <p className="workspace-sidebar__section-title">Explorer</p>
            <p className="workspace-sidebar__section-subtitle">
              {projectTitle || "Workspace"}
            </p>
          </div>

          {/* File actions: create & refresh */}
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

        {/* ---------------- File List Tree ---------------- */}
        <div className="workspace-sidebar__tree">
          <div className="workspace-sidebar__folder">
            <span className="workspace-sidebar__folder-icon">▾</span>
            <span className="workspace-sidebar__folder-name">src</span>
          </div>

          <div className="workspace-sidebar__files">
            {/* Loading state */}
            {loading && (
              <p className="workspace-sidebar__hint">Loading project files…</p>
            )}

            {/* Error state */}
            {!loading && error && (
              <p className="workspace-sidebar__hint workspace-sidebar__hint--error">
                {error}
              </p>
            )}

            {/* Empty state */}
            {!loading && !error && files.length === 0 && (
              <p className="workspace-sidebar__hint">
                This project has no files yet.
              </p>
            )}

            {/* File list */}
            {!loading && !error && files.length > 0 && (
              <ul className="workspace-sidebar__file-list">
                {files.map((file) => {
                  const isActive = file.id === activeFileId;
                  const itemClass = isActive
                    ? "workspace-sidebar__file workspace-sidebar__file--active"
                    : "workspace-sidebar__file";

                  return (
                    <li key={file.id} className="workspace-sidebar__file-row">
                      {/* File button (select) */}
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

                      {/* Delete button (if allowed) */}
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

      {/* ---------------- Collaborators Section ---------------- */}
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

        {/* Collaborator list */}
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
                {/* Avatar */}
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

                {/* Collaborator info */}
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

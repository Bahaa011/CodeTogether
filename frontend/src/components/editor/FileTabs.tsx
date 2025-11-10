/**
 * FileTabs Component
 * -------------------
 * Renders the horizontal tab bar for open editor files in the workspace.
 *
 * Responsibilities:
 * - Display open files with active tab highlighting.
 * - Allow quick switching between files via tab selection.
 * - Enable closing tabs individually.
 * - Display file save activity indicators ("saving...").
 * - Provide contextual empty-state feedback when no files are open.
 *
 * Context:
 * Used inside the Project Editor layout to mirror VS Code-style file tabs.
 */

import type { EditorFileState } from "../../hooks/useProjectEditor";

/**
 * Props
 * ------
 * - files: List of open editor file states.
 * - activeFileId: ID of the currently active file.
 * - onSelect: Callback when user clicks a tab to switch file focus.
 * - onClose: Callback when user closes a tab.
 * - onCreateFile: (optional) Add new file shortcut.
 * - disableCreate: (optional) Disable creation button if needed.
 */
type FileTabsProps = {
  files: EditorFileState[];
  activeFileId: number | null;
  onSelect(fileId: number): void;
  onClose(fileId: number): void;
  onCreateFile?(): void;
  disableCreate?: boolean;
};

/**
 * FileTabs
 * ----------
 * Functional component that renders file tab buttons with close controls.
 * Each tab reflects the filename and save state of its respective file.
 */
export default function FileTabs({
  files,
  activeFileId,
  onSelect,
  onClose,
}: FileTabsProps) {
  return (
    <div className="workspace-tabs">
      <div className="workspace-tabs__list">
        {/* Empty state */}
        {files.length === 0 ? (
          <span className="workspace-tabs__empty">
            Open a file from the explorer to start editing.
          </span>
        ) : (
          /* Render a tab for each open file */
          files.map((file) => {
            const isActive = file.id === activeFileId;
            const tabClass = isActive
              ? "workspace-tab workspace-tab--active"
              : "workspace-tab";

            return (
              <div key={file.id} className={tabClass}>
                {/* Main tab button: selects file */}
                <button
                  type="button"
                  onClick={() => onSelect(file.id)}
                  className="workspace-tab__main"
                >
                  <span className="workspace-tab__icon" aria-hidden="true" />
                  <span className="workspace-tab__name">{file.filename}</span>
                  {file.saving && (
                    <span className="workspace-tab__status workspace-tab__status--saving">
                      …
                    </span>
                  )}
                </button>

                {/* Close button: removes file from workspace */}
                <button
                  type="button"
                  onClick={() => onClose(file.id)}
                  className="workspace-tab__close"
                  aria-label={`Close ${file.filename}`}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

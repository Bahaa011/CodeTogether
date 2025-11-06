import type { EditorFileState } from "../../hooks/useProjectEditor";

type FileTabsProps = {
  files: EditorFileState[];
  activeFileId: number | null;
  onSelect(fileId: number): void;
  onClose(fileId: number): void;
  onCreateFile?(): void;
  disableCreate?: boolean;
};

export default function FileTabs({
  files,
  activeFileId,
  onSelect,
  onClose,
  onCreateFile,
  disableCreate = false,
}: FileTabsProps) {
  const createButton =
    onCreateFile &&
    (
      <button
        type="button"
        onClick={onCreateFile}
        disabled={disableCreate}
        className="workspace-tabs__action"
      >
        +
      </button>
    );

  return (
    <div className="workspace-tabs">
      <div className="workspace-tabs__list">
        {files.length === 0 ? (
          <span className="workspace-tabs__empty">
            Open a file from the explorer to start editing.
          </span>
        ) : (
          files.map((file) => {
            const isActive = file.id === activeFileId;
            const tabClass = isActive
              ? "workspace-tab workspace-tab--active"
              : "workspace-tab";

            return (
              <div key={file.id} className={tabClass}>
                <button
                  type="button"
                  onClick={() => onSelect(file.id)}
                  className="workspace-tab__main"
                >
                  <span className="workspace-tab__icon" aria-hidden="true" />
                  <span className="workspace-tab__name">{file.filename}</span>
                  {file.dirty && (
                    <span className="workspace-tab__status">●</span>
                  )}
                  {file.saving && (
                    <span className="workspace-tab__status workspace-tab__status--saving">
                      …
                    </span>
                  )}
                </button>
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
      {createButton}
    </div>
  );
}

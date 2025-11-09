import CodeEditor from "./editor/CodeEditor";
import Terminal from "./editor/Terminal";
import type { EditorFileState } from "../hooks/useProjectEditor";
import "../styles/playground.css";

type PlaygroundWorkspaceProps = {
  languages: { id: string; label: string; filename: string }[];
  activeLanguageId: string;
  editorFile: EditorFileState;
  running: boolean;
  terminalOpen: boolean;
  onLanguageChange(id: string): void;
  onRun(): void;
  onToggleTerminal(): void;
  onCodeChange(value: string | undefined): void;
};

export default function PlaygroundWorkspace({
  languages,
  activeLanguageId,
  editorFile,
  running,
  terminalOpen,
  onLanguageChange,
  onRun,
  onToggleTerminal,
  onCodeChange,
}: PlaygroundWorkspaceProps) {
  return (
    <section className="playground-workspace-shell">
      <div className="playground-topbar">
        <label className="playground-select" htmlFor="playground-language">
          <span>Language</span>
          <select
            id="playground-language"
            value={activeLanguageId}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label} · {lang.filename}
              </option>
            ))}
          </select>
        </label>
        <div className="playground-topbar__actions">
          <button type="button" className="playground-button playground-button--primary" onClick={onRun} disabled={running}>
            {running ? "Running…" : "Run"}
          </button>
          <button type="button" className="playground-button" onClick={onToggleTerminal}>
            {terminalOpen ? "Hide terminal" : "Terminal"}
          </button>
        </div>
      </div>

      <div className="playground-editor-row">
        <div className="playground-editor-wrapper">
          <CodeEditor file={editorFile} loading={false} onChange={onCodeChange} onSave={onRun} />
        </div>
        <div
          className={
            terminalOpen
              ? "playground-terminal-panel"
              : "playground-terminal-panel playground-terminal-panel--hidden"
          }
        >
          <Terminal />
        </div>
      </div>
    </section>
  );
}

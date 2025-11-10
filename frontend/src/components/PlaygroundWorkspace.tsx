/**
 * PlaygroundWorkspace Component
 * ------------------------------
 * Combines the CodeEditor and Terminal components into a lightweight,
 * single-file coding environment for quick experimentation.
 *
 * Responsibilities:
 * - Provide a focused workspace for writing and running code snippets.
 * - Let the user switch between supported languages dynamically.
 * - Manage editor-to-terminal interaction (Run, Hide/Show terminal).
 * - Display current execution state (running vs idle).
 *
 * Context:
 * Used by the /playground route to offer an instant, login-free
 * coding experience for JavaScript, Python, C++, and Java.
 */

import CodeEditor from "./editor/CodeEditor";
import Terminal from "./editor/Terminal";
import type { EditorFileState } from "../hooks/useProjectEditor";
import "../styles/playground.css";

/**
 * PlaygroundWorkspaceProps
 * -------------------------
 * Props accepted by the PlaygroundWorkspace component.
 *
 * - languages: Array of supported languages with id, label, and default filename.
 * - activeLanguageId: ID of currently selected language.
 * - editorFile: Current editor file state (content, id, etc.).
 * - running: Whether a code execution is currently in progress.
 * - terminalOpen: Whether the terminal panel is visible.
 * - onLanguageChange: Triggered when the user switches languages.
 * - onRun: Executes the active code (bound to "Run" button and Ctrl+S).
 * - onToggleTerminal: Shows or hides the terminal panel.
 * - onCodeChange: Called when code content changes in the editor.
 */
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

/**
 * PlaygroundWorkspace
 * --------------------
 * Layout component that structures the playground’s UI:
 * - Topbar: language selector + control buttons (Run / Terminal toggle).
 * - Editor row: Monaco-powered CodeEditor on the left.
 * - Terminal panel: collapsible runtime output view.
 */
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
      {/* ---------------- Topbar ---------------- */}
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
                {lang.label}
              </option>
            ))}
          </select>
        </label>

        {/* Control buttons: Run + Terminal toggle */}
        <div className="playground-topbar__actions">
          <button
            type="button"
            className="playground-button playground-button--primary"
            onClick={onRun}
            disabled={running}
          >
            {running ? "Running…" : "Run"}
          </button>
          <button
            type="button"
            className="playground-button"
            onClick={onToggleTerminal}
          >
            {terminalOpen ? "Hide terminal" : "Terminal"}
          </button>
        </div>
      </div>

      {/* ---------------- Editor & Terminal ---------------- */}
      <div className="playground-editor-row">
        <div className="playground-editor-wrapper">
          <CodeEditor
            file={editorFile}
            loading={false}
            onChange={onCodeChange}
            onSave={onRun}
          />
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

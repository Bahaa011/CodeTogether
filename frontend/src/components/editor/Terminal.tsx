/**
 * Terminal Component
 * -------------------
 * Displays the runtime console output for the CodeTogether workspace.
 *
 * Responsibilities:
 * - Stream live execution output (stdout, stderr, system logs).
 * - Allow user input to interactive programs (via stdin simulation).
 * - Display current execution state (running, stopped, etc.).
 * - Integrate with useTerminal hook for execution control.
 *
 * Context:
 * Appears below the editor pane, connected to the project’s sandbox runtime.
 */

import "../../styles/editor-workspace.css";
import { useTerminal } from "../../hooks/useTerminal";

/**
 * Terminal
 * ----------
 * Functional component rendering a simulated shell interface.
 * Uses the useTerminal hook for managing process state, I/O, and commands.
 */
export default function Terminal() {
  const {
    output,          // Stream of output lines (each with id, kind, text)
    inputValue,      // Current user input line
    isRunning,       // Whether a process is currently executing
    statusLabel,     // Descriptive label for current runtime state
    handleSubmitInput, // Submit input to running process
    handleStop,        // Stop running process
    handleInputChange, // Update input field as user types
    outputRef,         // Ref for autoscrolling output container
    inputRef,          // Ref for focusing input field
  } = useTerminal();

  return (
    <section className="terminal-pane">
      {/* ---------------- Header ---------------- */}
      <header className="terminal-pane__header">
        <span>Terminal</span>
        <div className="terminal-pane__actions">
          <span className="terminal-pane__status">{statusLabel}</span>
          <button
            type="button"
            className="terminal-pane__action-button"
            onClick={handleStop}
            disabled={!isRunning}
          >
            Stop
          </button>
        </div>
      </header>

      {/* ---------------- Output Body ---------------- */}
      <div className="terminal-pane__body" ref={outputRef}>
        {output.length === 0 ? (
          <p className="terminal-pane__line terminal-pane__line--muted">
            Awaiting execution request…
          </p>
        ) : (
          output.map((entry) => (
            <p
              key={entry.id}
              className={`terminal-pane__line terminal-pane__line--${entry.kind}`}
            >
              {entry.text}
            </p>
          ))
        )}
      </div>

      {/* ---------------- Input Footer ---------------- */}
      <form className="terminal-pane__footer" onSubmit={handleSubmitInput}>
        <span className="terminal-pane__prompt">&gt;</span>
        <input
          type="text"
          className="terminal-pane__input"
          value={inputValue}
          ref={inputRef}
          autoFocus
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder={
            isRunning ? "Send input to program..." : "Terminal idle"
          }
        />
      </form>
    </section>
  );
}

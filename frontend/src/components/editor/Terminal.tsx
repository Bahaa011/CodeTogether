import "../../styles/editor-workspace.css";
import { useTerminal } from "../../hooks/useTerminal";

export default function Terminal() {
  const {
    output,
    inputValue,
    isRunning,
    statusLabel,
    handleSubmitInput,
    handleStop,
    handleInputChange,
    outputRef,
    inputRef,
  } = useTerminal();

  return (
    <section className="terminal-pane">
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
      <form className="terminal-pane__footer" onSubmit={handleSubmitInput}>
        <span className="terminal-pane__prompt">&gt;</span>
        <input
          type="text"
          className="terminal-pane__input"
          value={inputValue}
          ref={inputRef}
          autoFocus
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder={isRunning ? "Send input to program..." : "Terminal idle"}
        />
      </form>
    </section>
  );
}

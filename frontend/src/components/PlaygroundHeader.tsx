import "../styles/playground.css";

type PlaygroundHeaderProps = {
  title: string;
  description: string;
  onGoHome?(): void;
};

export default function PlaygroundHeader({ title, description, onGoHome }: PlaygroundHeaderProps) {
  return (
    <header className="playground-header minimal">
      <div className="playground-header__stack">
        <p className="playground-eyebrow">Playground</p>
        <div className="playground-header__title-row">
          <h1>{title}</h1>
          {onGoHome && (
            <button type="button" className="playground-back-button" onClick={onGoHome} aria-label="Return to Home">
              ← Home
            </button>
          )}
        </div>
        <p>{description}</p>
      </div>
    </header>
  );
}

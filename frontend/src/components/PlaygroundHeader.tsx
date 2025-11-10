/**
 * PlaygroundHeader Component
 * ---------------------------
 * Displays the header section for the Playground page, providing context,
 * a short description, and an optional navigation button.
 *
 * Responsibilities:
 * - Render the Playground title and subtext description.
 * - Optionally display a “← Home” button to navigate back to the main site.
 * - Maintain visual hierarchy and alignment with the rest of the Playground layout.
 *
 * Context:
 * Used at the top of the /playground route above the editor workspace.
 * Appears as the first visible element in the Playground view.
 */

import "../styles/playground.css";

/**
 * PlaygroundHeaderProps
 * ----------------------
 * Props accepted by the PlaygroundHeader component.
 *
 * - title: Main heading text.
 * - description: Short descriptive paragraph below the title.
 * - onGoHome: Optional callback for returning to the home page.
 */
type PlaygroundHeaderProps = {
  title: string;
  description: string;
  onGoHome?(): void;
};

/**
 * PlaygroundHeader
 * -----------------
 * Simple top-level header for the Playground view, with a minimal design.
 * Provides context about what the playground is for and includes an optional
 * “← Home” button for quick navigation.
 */
export default function PlaygroundHeader({
  title,
  description,
  onGoHome,
}: PlaygroundHeaderProps) {
  return (
    <header className="playground-header minimal">
      <div className="playground-header__stack">
        {/* ---------------- Header Eyebrow ---------------- */}
        <p className="playground-eyebrow">Playground</p>

        {/* ---------------- Title Row ---------------- */}
        <div className="playground-header__title-row">
          <h1>{title}</h1>
          {onGoHome && (
            <button
              type="button"
              className="playground-back-button"
              onClick={onGoHome}
              aria-label="Return to Home"
            >
              ← Home
            </button>
          )}
        </div>

        {/* ---------------- Description ---------------- */}
        <p>{description}</p>
      </div>
    </header>
  );
}

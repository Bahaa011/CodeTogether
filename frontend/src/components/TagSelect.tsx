/**
 * TagSelect Component
 * --------------------
 * Provides a controlled, multi-select interface for project tags.
 *
 * Responsibilities:
 * - Display a predefined list of available tag options.
 * - Allow users to toggle tags on or off, up to a defined maximum limit.
 * - Reflect disabled and active states visually.
 * - Return updated tag lists via onChange callback.
 *
 * Context:
 * Used within project creation and editing modals to assign topics or labels
 * to projects (e.g., “Web”, “AI”, “Education”, etc.).
 */

import { MAX_PROJECT_TAGS, PROJECT_TAG_OPTIONS } from "../utils/projectTags";
import "../styles/tag-select.css";

/**
 * TagSelectProps
 * ---------------
 * Props accepted by the TagSelect component.
 *
 * - selectedTags: List of tags currently chosen by the user.
 * - onChange: Callback fired whenever the tag list changes.
 * - disabled: Disables user interaction if true.
 * - label: Optional header label for the tag selector (defaults to “Project tags”).
 */
type TagSelectProps = {
  selectedTags: string[];
  onChange(next: string[]): void;
  disabled?: boolean;
  label?: string;
};

/**
 * TagSelect
 * -----------
 * A simple, self-contained component for tag selection with a visual limit.
 * Prevents additional selections beyond MAX_PROJECT_TAGS.
 */
export default function TagSelect({
  selectedTags,
  onChange,
  disabled = false,
  label = "Project tags",
}: TagSelectProps) {
  /** Whether the user has reached the tag selection limit */
  const maxReached = selectedTags.length >= MAX_PROJECT_TAGS;

  /**
   * handleToggle
   * --------------
   * Toggles a tag between active and inactive states.
   * - Removes tag if already selected.
   * - Adds tag if within limit and not disabled.
   */
  const handleToggle = (tag: string) => {
    if (disabled) return;

    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((value) => value !== tag));
      return;
    }

    if (maxReached) return;

    onChange([...selectedTags, tag]);
  };

  return (
    <div className="tag-select">
      {/* ---------------- Header ---------------- */}
      <div className="tag-select__header">
        <p className="tag-select__label">{label}</p>
        <span className="tag-select__hint">
          Choose up to {MAX_PROJECT_TAGS}
        </span>
      </div>

      {/* ---------------- Tag Options ---------------- */}
      <div className="tag-select__options">
        {PROJECT_TAG_OPTIONS.map((option) => {
          const isActive = selectedTags.includes(option);
          const isDisabled = disabled || (!isActive && maxReached);

          const className = [
            "tag-select__option",
            isActive ? "is-active" : "",
            isDisabled && !isActive ? "is-disabled" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={option}
              type="button"
              className={className}
              onClick={() => handleToggle(option)}
              disabled={isDisabled}
            >
              <span>{option}</span>
              {isActive && <span className="tag-select__check">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

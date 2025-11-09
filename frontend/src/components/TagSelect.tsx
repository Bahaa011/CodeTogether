import { MAX_PROJECT_TAGS, PROJECT_TAG_OPTIONS } from "../utils/projectTags";
import "../styles/tag-select.css";

type TagSelectProps = {
  selectedTags: string[];
  onChange(next: string[]): void;
  disabled?: boolean;
  label?: string;
};

export default function TagSelect({
  selectedTags,
  onChange,
  disabled = false,
  label = "Project tags",
}: TagSelectProps) {
  const maxReached = selectedTags.length >= MAX_PROJECT_TAGS;

  const handleToggle = (tag: string) => {
    if (disabled) {
      return;
    }
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((value) => value !== tag));
      return;
    }
    if (maxReached) {
      return;
    }
    onChange([...selectedTags, tag]);
  };

  return (
    <div className="tag-select">
      <div className="tag-select__header">
        <p className="tag-select__label">{label}</p>
        <span className="tag-select__hint">
          Choose up to {MAX_PROJECT_TAGS}
        </span>
      </div>
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

/**
 * CreateProjectModal Component
 * ------------------------------
 * A modal dialog that enables users to create a new project workspace.
 * Provides a form for entering project name, description, privacy settings,
 * and selecting relevant tags.
 *
 * Responsibilities:
 * - Render an accessible form wrapped in a shared Modal component.
 * - Manage form state (title, description, visibility, tags) through custom hook logic.
 * - Handle form submission and async creation flow via `useCreateProjectModal`.
 *
 * Context:
 * Typically invoked when a user clicks the “New Project” button from the Navbar
 * or Dashboard. The modal guides them through the initial setup of a CodeTogether project.
 */

import Modal from "./Modal";
import TagSelect from "../TagSelect";
import { useCreateProjectModal } from "../../hooks/useCreateModals";

/**
 * CreateProjectModalProps
 * ------------------------
 * Props accepted by the CreateProjectModal component.
 *
 * - open: Whether the modal is visible.
 * - onClose: Function that closes the modal when cancelled or after successful creation.
 */
type CreateProjectModalProps = {
  open: boolean;
  onClose(): void;
};

/**
 * CreateProjectModal
 * -------------------
 * Renders the new project creation flow in a modal interface.
 * Integrates `useCreateProjectModal` for managing form state and submission logic.
 */
export default function CreateProjectModal({
  open,
  onClose,
}: CreateProjectModalProps) {
  /**
   * Hook: useCreateProjectModal
   * -----------------------------
   * Centralized hook controlling the form’s internal logic:
   * - Handles title, description, tags, and privacy state.
   * - Provides async submission (`handleSubmit`) and validation handling.
   * - Returns UI feedback flags (`submitting`, `error`).
   */
  const {
    title,
    setTitle,
    description,
    setDescription,
    isPrivate,
    setIsPrivate,
    selectedTags,
    setSelectedTags,
    error,
    submitting,
    handleSubmit,
  } = useCreateProjectModal({ open, onClose });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Project"
      footer={
        <div className="modal-actions">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="modal-button modal-button--ghost"
            disabled={submitting}
          >
            Cancel
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            form="create-project-form"
            className="modal-button modal-button--primary"
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      }
    >
      {/* Project Creation Form */}
      <form
        id="create-project-form"
        onSubmit={handleSubmit}
        className="modal-form"
      >
        {/* ---- Project Name ---- */}
        <div className="modal-field">
          <label
            htmlFor="project-name"
            className="modal-field__label"
          >
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={title}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            className="modal-field__control"
            placeholder="My awesome project"
            disabled={submitting}
          />
        </div>

        {/* ---- Description ---- */}
        <div className="modal-field">
          <label
            htmlFor="project-description"
            className="modal-field__label"
          >
            Description
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="modal-field__control modal-textarea"
            placeholder="What are you building?"
            disabled={submitting}
          />
        </div>

        {/* ---- Privacy Option ---- */}
        <label className="modal-checkbox">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            disabled={submitting}
          />
          Make project private
        </label>

        {/* ---- Tags ---- */}
        <TagSelect
          selectedTags={selectedTags}
          onChange={setSelectedTags}
          disabled={submitting}
          label="Add tags"
        />

        {/* ---- Error Feedback ---- */}
        {error && (
          <p className="modal-error">{error}</p>
        )}
      </form>
    </Modal>
  );
}

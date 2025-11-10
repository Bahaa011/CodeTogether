/**
 * CreateFileModal Component
 * ----------------------------
 * A modal dialog that allows users to create a new file within
 * an existing project. Designed for simplicity and quick workflow.
 *
 * Responsibilities:
 * - Display filename and optional content fields.
 * - Handle validation, submission, and error display.
 * - Integrate with the backend file creation service via `onCreate`.
 *
 * Context:
 * Typically opened from the project workspace sidebar when
 * clicking the “+” button under the Explorer section.
 * Uses the shared `Modal` component for consistent layout and accessibility.
 */

import Modal from "./Modal";
import { useCreateFileModal } from "../../hooks/useCreateModals";

/**
 * CreateFileModalProps
 * ----------------------
 * Props accepted by the CreateFileModal component.
 *
 * - open: Whether the modal is visible.
 * - onClose: Callback to close the modal.
 * - onCreate: Async handler that receives `{ filename, content }` for file creation.
 * - disabled: Optional flag to prevent input and submission.
 */
type CreateFileModalProps = {
  open: boolean;
  onClose(): void;
  onCreate(input: { filename: string; content: string }): Promise<void>;
  disabled?: boolean;
};

/**
 * CreateFileModal
 * ----------------
 * Provides a minimal form for creating a new file inside a project.
 * Supports optional initial content, validation, and async submission.
 */
export default function CreateFileModal({
  open,
  onClose,
  onCreate,
  disabled = false,
}: CreateFileModalProps) {
  /**
   * Hook: useCreateFileModal
   * -------------------------
   * Manages local state and form submission logic.
   * - filename: Bound to filename input field.
   * - content: Optional text content for new file.
   * - submitting: Async in-progress flag.
   * - error: Error message for validation or API failure.
   * - handleSubmit: Form submission handler.
   */
  const {
    filename,
    setFilename,
    content,
    setContent,
    error,
    submitting,
    handleSubmit,
  } = useCreateFileModal({ open, onCreate, disabled });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create File"
      footer={
        <div className="modal-actions">
          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="modal-button modal-button--ghost"
            disabled={submitting}
          >
            Cancel
          </button>

          {/* Create button */}
          <button
            type="submit"
            form="create-file-form"
            className="modal-button modal-button--primary"
            disabled={submitting || disabled}
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      }
    >
      {/* File creation form */}
      <form id="create-file-form" onSubmit={handleSubmit} className="modal-form">
        {/* ---- Filename ---- */}
        <div className="modal-field">
          <label htmlFor="file-name" className="modal-field__label">
            Filename
          </label>
          <input
            id="file-name"
            type="text"
            value={filename}
            autoFocus
            onChange={(event) => setFilename(event.target.value)}
            className="modal-field__control"
            placeholder="src/index.ts"
            disabled={submitting}
          />
        </div>

        {/* ---- Optional Content ---- */}
        <div className="modal-field">
          <label htmlFor="file-content" className="modal-field__label">
            Initial Content (optional)
          </label>
          <textarea
            id="file-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="modal-field__control modal-textarea"
            placeholder="// Start typing..."
            disabled={submitting}
          />
          <p className="modal-helper">
            Leave empty to create an empty file.
          </p>
        </div>

        {/* ---- Error Feedback ---- */}
        {error && <p className="modal-error">{error}</p>}
      </form>
    </Modal>
  );
}

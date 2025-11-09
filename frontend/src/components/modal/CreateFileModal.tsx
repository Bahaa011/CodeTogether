import Modal from "./Modal";
import { useCreateFileModal } from "../../hooks/useCreateModals";

type CreateFileModalProps = {
  open: boolean;
  onClose(): void;
  onCreate(input: { filename: string; content: string }): Promise<void>;
  disabled?: boolean;
};

export default function CreateFileModal({
  open,
  onClose,
  onCreate,
  disabled = false,
}: CreateFileModalProps) {
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
          <button
            type="button"
            onClick={onClose}
            className="modal-button modal-button--ghost"
            disabled={submitting}
          >
            Cancel
          </button>
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
      <form id="create-file-form" onSubmit={handleSubmit} className="modal-form">
        <div className="modal-field">
          <label
            htmlFor="file-name"
            className="modal-field__label"
          >
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

        <div className="modal-field">
          <label
            htmlFor="file-content"
            className="modal-field__label"
          >
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

        {error && (
          <p className="modal-error">{error}</p>
        )}
      </form>
    </Modal>
  );
}

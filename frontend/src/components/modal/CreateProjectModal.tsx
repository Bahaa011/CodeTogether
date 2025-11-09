import Modal from "./Modal";
import TagSelect from "../TagSelect";
import { useCreateProjectModal } from "../../hooks/useCreateModals";

type CreateProjectModalProps = {
  open: boolean;
  onClose(): void;
};

export default function CreateProjectModal({
  open,
  onClose,
}: CreateProjectModalProps) {
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
            form="create-project-form"
            className="modal-button modal-button--primary"
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      }
    >
      <form
        id="create-project-form"
        onSubmit={handleSubmit}
        className="modal-form"
      >
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

        <label className="modal-checkbox">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            disabled={submitting}
          />
          Make project private
        </label>

        <TagSelect
          selectedTags={selectedTags}
          onChange={setSelectedTags}
          disabled={submitting}
          label="Add tags"
        />

        {error && (
          <p className="modal-error">{error}</p>
        )}
      </form>
    </Modal>
  );
}

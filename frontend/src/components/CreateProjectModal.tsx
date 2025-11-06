import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import { createProject } from "../services/projectService";
import { getStoredUser } from "../utils/auth";

type CreateProjectModalProps = {
  open: boolean;
  onClose(): void;
};

export default function CreateProjectModal({
  open,
  onClose,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setIsPrivate(false);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const owner = getStoredUser();
    if (!owner?.id) {
      setError("You need to be logged in to create a project.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError("Project name is required.");
      return;
    }

    if (!trimmedDescription) {
      setError("Project description is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const project = await createProject({
        title: trimmedTitle,
        description: trimmedDescription,
        owner_id: owner.id,
        is_public: !isPrivate,
      });

      onClose();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create project.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

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

        {error && (
          <p className="modal-error">{error}</p>
        )}
      </form>
    </Modal>
  );
}

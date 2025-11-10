/**
 * useCreateModals Hook Collection
 *
 * Provides reusable logic for "Create Project" and "Create File" modal workflows.
 *
 * Responsibilities:
 * - Manage modal form state (inputs, validation, and submission).
 * - Reset fields when the modal closes.
 * - Handle async actions (e.g., API requests to create a project or file).
 * - Provide consistent error handling and state updates across both modals.
 */

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../services/projectService";
import { getStoredUser } from "../utils/auth";

/**
 * useModalReset
 *
 * Resets modal form state when the modal is closed.
 * Used by both the project and file creation modals.
 */
function useModalReset(open: boolean, reset: () => void) {
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);
}

/**
 * useCreateProjectModal
 *
 * Handles logic for creating new projects via the CreateProjectModal component.
 *
 * Returns:
 * - title, description, isPrivate, selectedTags → Controlled form fields.
 * - error → Any validation or server error message.
 * - submitting → Whether the create action is currently in progress.
 * - handleSubmit → Submits the form and creates a new project.
 */
export function useCreateProjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose(): void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Resets all fields when modal closes
  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setIsPrivate(false);
    setSelectedTags([]);
    setError(null);
    setSubmitting(false);
  }, []);

  useModalReset(open, resetForm);

  // Handles the project creation process
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
        tags: selectedTags,
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

  return {
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
  };
}

/**
 * useCreateFileModal
 *
 * Handles logic for creating new files within a project via the CreateFileModal component.
 *
 * Returns:
 * - filename, content → Controlled form fields for file creation.
 * - error → Any validation or API error.
 * - submitting → Whether the file creation is in progress.
 * - handleSubmit → Handles file creation logic with validation and reset.
 */
export function useCreateFileModal({
  open,
  disabled = false,
  onCreate,
}: {
  open: boolean;
  disabled?: boolean;
  onCreate(input: { filename: string; content: string }): Promise<void>;
}) {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset fields when modal closes
  const resetForm = useCallback(() => {
    setFilename("");
    setContent("");
    setError(null);
    setSubmitting(false);
  }, []);

  useModalReset(open, resetForm);

  // Handles the file creation process
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedName = filename.trim();
    if (!trimmedName) {
      setError("Filename is required.");
      return;
    }

    if (disabled) {
      setError("You need access to this project to create files.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onCreate({
        filename: trimmedName,
        content,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create file.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    filename,
    setFilename,
    content,
    setContent,
    error,
    submitting,
    handleSubmit,
  };
}

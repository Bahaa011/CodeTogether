import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../services/projectService";
import { getStoredUser } from "../utils/auth";

type UseCreateProjectModalOptions = {
  open: boolean;
  onClose(): void;
};

type UseCreateFileModalOptions = {
  open: boolean;
  disabled?: boolean;
  onCreate(input: { filename: string; content: string }): Promise<void>;
};

function useModalReset(open: boolean, reset: () => void) {
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);
}

export function useCreateProjectModal({
  open,
  onClose,
}: UseCreateProjectModalOptions) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setIsPrivate(false);
    setSelectedTags([]);
    setError(null);
    setSubmitting(false);
  }, []);

  useModalReset(open, resetForm);

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

export function useCreateFileModal({
  open,
  disabled = false,
  onCreate,
}: UseCreateFileModalOptions) {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setFilename("");
    setContent("");
    setError(null);
    setSubmitting(false);
  }, []);

  useModalReset(open, resetForm);

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

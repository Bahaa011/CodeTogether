import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { deleteProject, updateProject, type Project } from "../services/projectService";
import {
  fetchCollaboratorsByProject,
  removeCollaborator,
  type CollaboratorRecord,
} from "../services/collaboratorService";

export type ProjectSettingsTabId = "details" | "backups" | "collaborators";

type UseProjectSettingsModalOptions = {
  open: boolean;
  project: Project | null;
  canEdit: boolean;
  onProjectUpdated(project: Project): void;
};

export function useProjectSettingsModal({
  open,
  project,
  canEdit,
  onProjectUpdated,
}: UseProjectSettingsModalOptions) {
  const [activeTab, setActiveTab] =
    useState<ProjectSettingsTabId>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "error">("info");
  const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>(
    [],
  );
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [collaboratorsError, setCollaboratorsError] = useState<string | null>(
    null,
  );
  const [collaboratorAction, setCollaboratorAction] = useState<
    string | null
  >(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setDeletingProject(false);
      setDeleteProjectError(null);
      return;
    }
    setActiveTab("details");
    setStatusMessage(null);
  }, [open]);

  useEffect(() => {
    if (!project) {
      setTitle("");
      setDescription("");
      setIsPublic(false);
      setSelectedTags([]);
      return;
    }
    setTitle(project.title ?? "");
    setDescription(project.description ?? "");
    setIsPublic(Boolean(project.is_public));
    const tagList =
      project.tags
        ?.map((tag) => tag?.tag)
        .filter((value): value is string => Boolean(value)) ?? [];
    setSelectedTags(tagList);
  }, [project]);

  useEffect(() => {
    if (!project?.id || activeTab !== "collaborators") {
      return;
    }

    let cancelled = false;
    setCollaboratorsLoading(true);
    setCollaboratorsError(null);
    setCollaboratorAction(null);

    const load = async () => {
      try {
        const data = await fetchCollaboratorsByProject(project.id);
        if (cancelled) return;
        setCollaborators(data);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load collaborators.";
        setCollaboratorsError(message);
        setCollaborators([]);
      } finally {
        if (!cancelled) {
          setCollaboratorsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeTab, project?.id]);

  const detailsChanged = useMemo(() => {
    if (!project) return false;
    const originalTags =
      project.tags
        ?.map((tag) => tag?.tag)
        .filter((value): value is string => Boolean(value)) ?? [];
    const canonical = (list: string[]) => list.slice().sort().join("|");
    const tagsChanged = canonical(selectedTags) !== canonical(originalTags);
    return (
      title.trim() !== (project.title ?? "").trim() ||
      description.trim() !== (project.description ?? "").trim() ||
      Boolean(isPublic) !== Boolean(project.is_public) ||
      tagsChanged
    );
  }, [description, isPublic, project, selectedTags, title]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!project || !detailsChanged || !canEdit) {
      return;
    }
    setSaving(true);
    setStatusMessage(null);

    try {
      const updated = await updateProject(project.id, {
        title: title.trim(),
        description: description.trim(),
        is_public: isPublic,
        tags: selectedTags,
      });
      onProjectUpdated(updated);
      setStatusTone("info");
      setStatusMessage("Project details updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update project.";
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCollaborator = async (record: CollaboratorRecord) => {
    if (!record.id) {
      return;
    }
    setCollaboratorAction(null);
    try {
      await removeCollaborator(record.id);
      setCollaborators((prev) => prev.filter((item) => item.id !== record.id));
      setCollaboratorAction(
        `Removed ${
          record.user?.username ?? record.user?.email ?? "collaborator"
        }.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to remove collaborator.";
      setCollaboratorAction(message);
    }
  };

  const handleDeleteProject = async () => {
    if (!project?.id) {
      throw new Error("Project is still loading.");
    }
    if (!canEdit) {
      throw new Error("You do not have permission to delete this project.");
    }

    setDeletingProject(true);
    setDeleteProjectError(null);
    try {
      await deleteProject(project.id);
      setStatusTone("info");
      setStatusMessage("Project deleted.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete project.";
      setDeleteProjectError(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setDeletingProject(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    selectedTags,
    setSelectedTags,
    saving,
    statusMessage,
    statusTone,
    collaborators,
    collaboratorsLoading,
    collaboratorsError,
    collaboratorAction,
    detailsChanged,
    handleSubmit,
    handleRemoveCollaborator,
    handleDeleteProject,
    deletingProject,
    deleteProjectError,
  };
}

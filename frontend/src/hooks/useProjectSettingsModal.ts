/**
 * useProjectSettingsModal Hook
 *
 * Manages the logic and data flow for the Project Settings modal.
 * Handles project details, collaborators, and deletion functionality,
 * ensuring a clean separation between UI rendering and business logic.
 *
 * Responsibilities:
 * - Manage project metadata (title, description, visibility, tags).
 * - Handle tab navigation between “Details”, “Backups”, and “Collaborators”.
 * - Fetch and modify collaborator lists.
 * - Submit updates to project settings and reflect changes in parent state.
 * - Handle project deletion with proper permission checks.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { type Project } from "../graphql/project.api";
import { type CollaboratorRecord } from "../graphql/collaborator.api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loadCollaboratorsForProject,
  removeCollaboratorFromProject,
  removeCollaboratorThunk,
} from "../store/collaboratorsSlice";
import { updateProjectThunk, deleteProjectThunk } from "../store/projectsSlice";

/**
 * ProjectSettingsTabId
 *
 * Enumerates the available sections in the Project Settings modal:
 * - "details": Edit project information (title, description, tags, etc.)
 * - "backups": View or manage saved project backups.
 * - "collaborators": Manage project collaborators.
 */
export type ProjectSettingsTabId = "details" | "backups" | "collaborators";

/**
 * UseProjectSettingsModalOptions
 *
 * Configuration options passed into the hook.
 * - open: Whether the modal is currently visible.
 * - project: The project entity being managed.
 * - canEdit: Whether the current user has permission to modify the project.
 * - onProjectUpdated: Callback invoked when project details are successfully updated.
 */
type UseProjectSettingsModalOptions = {
  open: boolean;
  project: Project | null;
  canEdit: boolean;
  onProjectUpdated(project: Project): void;
};

/**
 * useProjectSettingsModal
 *
 * Provides full reactive management for the Project Settings modal.
 *
 * Returns:
 * - activeTab: The currently active tab ("details", "backups", or "collaborators").
 * - title, description, isPublic, selectedTags: Current editable project fields.
 * - saving: Indicates if project changes are being saved.
 * - statusMessage / statusTone: Feedback message and its visual tone ("info" | "error").
 * - collaborators: List of project collaborators.
 * - collaboratorsLoading / collaboratorsError: Loading/error states for collaborator fetch.
 * - collaboratorAction: Recent collaborator action message.
 * - deletingProject / deleteProjectError: Track project deletion state and errors.
 * - detailsChanged: Whether unsaved modifications exist.
 * - handleSubmit(): Submits updated project details.
 * - handleRemoveCollaborator(record): Removes a collaborator from the project.
 * - handleDeleteProject(): Deletes the project permanently.
 */
export function useProjectSettingsModal({
  open,
  project,
  canEdit,
  onProjectUpdated,
}: UseProjectSettingsModalOptions) {
  // --- State: Tabs & Form Fields ---
  const [activeTab, setActiveTab] =
    useState<ProjectSettingsTabId>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // --- State: Status & Saving ---
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "error">("info");

  // --- State: Collaborators ---
  const dispatch = useAppDispatch();
  const collaboratorsState = useAppSelector((state) =>
    project?.id ? state.collaborators.byProjectId[project.id] : undefined,
  );
  const collaborators = collaboratorsState?.list ?? [];
  const collaboratorsLoading = collaboratorsState?.status === "loading";
  const collaboratorsError = collaboratorsState?.error ?? null;
  const [collaboratorAction, setCollaboratorAction] = useState<string | null>(
    null,
  );

  // --- State: Project Deletion ---
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState<string | null>(
    null,
  );

  /**
   * Effect: Reset state when modal opens or closes.
   * Resets transient states like delete confirmation and status messages.
   */
  useEffect(() => {
    if (!open) {
      setDeletingProject(false);
      setDeleteProjectError(null);
      return;
    }
    setActiveTab("details");
    setStatusMessage(null);
  }, [open]);

  /**
   * Effect: Populate editable fields when project data changes.
   */
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

  /**
   * Effect: Load collaborator list when the "Collaborators" tab is opened.
   */
  useEffect(() => {
    if (!open || activeTab !== "collaborators" || !project?.id) return;
    setCollaboratorAction(null);
    void dispatch(loadCollaboratorsForProject(project.id));
  }, [activeTab, dispatch, open, project?.id]);

  /**
   * Derived: Detect whether editable fields differ from the original project.
   */
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

  /**
   * handleSubmit
   *
   * Saves modified project details to the backend.
   * Displays feedback message on success or failure.
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!project || !detailsChanged || !canEdit) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      const updated = await dispatch(
        updateProjectThunk({
          projectId: project.id,
          input: {
            title: title.trim(),
            description: description.trim(),
            is_public: isPublic,
            tags: selectedTags,
          },
        }),
      ).unwrap();
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

  /**
   * handleRemoveCollaborator
   *
   * Removes a collaborator from the current project.
   * Updates the collaborator list on success.
   */
  const handleRemoveCollaborator = useCallback(
    async (record: CollaboratorRecord) => {
      if (!record.id || !project?.id) return;
      setCollaboratorAction(null);

      try {
        await dispatch(
          removeCollaboratorThunk({
            projectId: project.id,
            collaboratorId: record.id,
          }),
        ).unwrap();
        dispatch(
          removeCollaboratorFromProject({
            projectId: project.id,
            collaboratorId: record.id,
          }),
        );
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
    },
    [dispatch, project?.id],
  );

  /**
   * handleDeleteProject
   *
   * Permanently deletes the current project.
   * Requires edit permissions and a valid project ID.
   */
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
      await dispatch(
        deleteProjectThunk({ projectId: project.id }),
      ).unwrap();
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

  // --- Return API ---
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

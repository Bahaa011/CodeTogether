import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar, { type SidebarCollaborator } from "../components/Sidebar";
import FileTabs from "../components/Editor/FileTabs";
import CodeEditor from "../components/Editor/CodeEditor";
import { useProjectEditor } from "../hooks/useProjectEditor";
import { AUTH_USER_EVENT, getStoredUser, type StoredUser } from "../utils/auth";
import CreateFileModal from "../components/Editor/CreateFileModal";
import InviteCollaboratorModal from "../components/InviteCollaboratorModal";
import ProjectSettingsModal from "../components/ProjectSettingsModal";
import { fetchProjectById, type Project } from "../services/projectService";
import { inviteCollaborator } from "../services/collaboratorService";
import { createVersionBackup } from "../services/versionService";
import Terminal from "../components/Editor/Terminal";
import { useRealtimeCollaboration } from "../hooks/useRealtimeCollaboration";
import "../styles/project-view.css";
import "../styles/editor-pane.css";
import { resolveAssetUrl } from "../utils/url";

export default function ProjectView() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectId = useMemo(() => {
    if (!projectIdParam) return null;
    const parsed = Number(projectIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  }, [projectIdParam]);

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() =>
    getStoredUser(),
  );
  const [projectMeta, setProjectMeta] = useState<Project | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncUser = () => {
      setCurrentUser(getStoredUser());
    };

    window.addEventListener(AUTH_USER_EVENT, syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener(AUTH_USER_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const currentUserId = currentUser?.id ?? null;
  const ownerId = projectMeta?.owner?.id ?? projectMeta?.ownerId ?? null;
  const isProjectOwner = ownerId !== null && ownerId === currentUserId;
  const canEditProject = useMemo(() => {
    if (!currentUserId || !projectMeta) {
      return false;
    }

    if (isProjectOwner) {
      return true;
    }

    return (
      projectMeta.collaborators?.some(
        (collaborator) => collaborator.user?.id === currentUserId,
      ) ?? false
    );
  }, [currentUserId, isProjectOwner, projectMeta]);
  const readOnlyAccess = !canEditProject;
  const readOnlyBannerVisible = Boolean(projectMeta) && readOnlyAccess;

  useEffect(() => {
    let cancelled = false;

    const loadProjectMeta = async () => {
      if (!projectId) {
        setProjectMeta(null);
        setMetaError("Select a project to begin.");
        return;
      }

      setMetaLoading(true);
      setMetaError(null);

      try {
        const data = await fetchProjectById(projectId);
        if (cancelled) return;
        setProjectMeta(data);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unable to load project.";
        setMetaError(message);
        setProjectMeta(null);
      } finally {
        if (!cancelled) {
          setMetaLoading(false);
        }
      }
    };

    void loadProjectMeta();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const {
    files,
    openFiles,
    activeFile,
    loading,
    error,
    openFile,
    closeFile,
    selectFile,
    updateDraft,
    saveFile,
    refresh,
    createFile,
    syncFileContent,
  } = useProjectEditor(projectId, currentUserId);

  const {
    status: collaborationStatus,
    error: collaborationError,
    handleLocalChange: emitCollaborativeChange,
    resyncing,
  } = useRealtimeCollaboration({
    activeFile,
    canEdit: !readOnlyAccess,
    syncFileContent,
  });

  const activeFileId = activeFile?.id ?? null;
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteBanner, setInviteBanner] = useState<{
    tone: "info" | "error";
    text: string;
  } | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupBanner, setBackupBanner] = useState<{
    tone: "info" | "error";
    text: string;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setInviteBanner(null);
    setIsInviteModalOpen(false);
  }, [projectId]);

  useEffect(() => {
    const handleInviteRequest = () => {
      if (isProjectOwner) {
        setIsInviteModalOpen(true);
      }
    };

    window.addEventListener("invite-collaborator", handleInviteRequest);
    return () => {
      window.removeEventListener("invite-collaborator", handleInviteRequest);
    };
  }, [isProjectOwner]);

  useEffect(() => {
    setBackupBanner(null);
  }, [activeFileId]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!activeFileId || readOnlyAccess) {
        return;
      }
      updateDraft(activeFileId, value);
      emitCollaborativeChange(value);
    },
    [activeFileId, emitCollaborativeChange, readOnlyAccess, updateDraft],
  );

  const handleCreateFile = useCallback(
    async ({ filename, content }: { filename: string; content: string }) => {
      if (readOnlyAccess) {
        throw new Error(
          "You do not have permission to create files in this project.",
        );
      }
      await createFile({ filename, content });
      setIsCreateFileOpen(false);
    },
    [createFile, readOnlyAccess],
  );

  const handleOpenCreateFile = useCallback(() => {
    if (readOnlyAccess) {
      return;
    }
    setIsCreateFileOpen(true);
  }, [readOnlyAccess]);

  const handleCloseInviteModal = useCallback(() => {
    setIsInviteModalOpen(false);
  }, []);

  const handleBackupFile = useCallback(async () => {
    if (!activeFile || readOnlyAccess) {
      return;
    }

    setIsBackingUp(true);
    try {
      await createVersionBackup({
        fileId: activeFile.id,
        content: activeFile.draftContent ?? "",
        userId: currentUserId ?? undefined,
      });
      setBackupBanner({
        tone: "info",
        text: `Backup created at ${new Date().toLocaleTimeString()}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create backup.";
      setBackupBanner({
        tone: "error",
        text: message,
      });
    } finally {
      setIsBackingUp(false);
    }
  }, [activeFile, currentUserId, readOnlyAccess]);

  const handleBackupShortcut = useCallback(() => {
    void handleBackupFile();
  }, [handleBackupFile]);

  const handleOpenWorkspaceSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseWorkspaceSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleInviteCollaborator = useCallback(
    async (identifier: string) => {
      if (!projectId || !currentUserId) {
        throw new Error(
          "You need to be signed in to send invitations.",
        );
      }

      try {
        await inviteCollaborator({
          inviterId: currentUserId,
          projectId,
          inviteeIdentifier: identifier,
        });
        setInviteBanner({
          tone: "info",
          text: `Invitation sent to ${identifier}.`,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to send invitation.";
        throw new Error(message);
      }
    },
    [currentUserId, projectId],
  );

  const handleProjectUpdated = useCallback((next: Project) => {
    setProjectMeta(next);
  }, []);

  const handleRunActiveFile = useCallback(async () => {
    if (!activeFile) {
      return;
    }

    const payload = {
      fileId: activeFile.id,
      filename: activeFile.filename,
      code: activeFile.draftContent ?? "",
      fileType: activeFile.file_type,
      language: activeFile.file_type,
    };

    setIsRunning(true);

    if (
      !readOnlyAccess &&
      (activeFile.dirty || activeFile.saveError)
    ) {
      const saved = await saveFile(activeFile.id);
      if (!saved) {
        setIsRunning(false);
        return;
      }
    }

    setIsTerminalOpen(true);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("run-file-requested", {
          detail: payload,
        }),
      );
    }
  }, [activeFile, readOnlyAccess, saveFile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleRunState = (event: Event) => {
      const customEvent = event as CustomEvent<{ running: boolean }>;
      setIsRunning(Boolean(customEvent.detail?.running));
    };

    window.addEventListener(
      "run-execution-state",
      handleRunState as EventListener,
    );

    return () => {
      window.removeEventListener(
        "run-execution-state",
        handleRunState as EventListener,
      );
    };
  }, []);

  const handleToggleTerminal = useCallback(() => {
    setIsTerminalOpen((open) => !open);
  }, []);

  const handleGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const ownerLabel = useMemo(() => {
    const owner = projectMeta?.owner;
    if (!owner) return null;
    return owner.username || owner.email || `User #${owner.id}`;
  }, [projectMeta?.owner]);

  const workspaceCollaborators = useMemo<SidebarCollaborator[]>(() => {
    const palette = ["#2563eb", "#9333ea", "#f97316", "#0ea5e9", "#ef4444"];
    const collaboratorMap = new Map<
      string,
      {
        name: string;
        status: SidebarCollaborator["status"];
        color: string;
        avatarUrl?: string | null;
      }
    >();

    const assignCollaborator = (
      id: string,
      name: string | null | undefined,
      status: SidebarCollaborator["status"],
      avatarUrl?: string | null,
    ) => {
      if (!name) return;
      const existing = collaboratorMap.get(id);
      if (existing) {
        if (existing.status !== "online" && status === "online") {
          existing.status = "online";
        }
        if (!existing.avatarUrl && avatarUrl) {
          existing.avatarUrl = avatarUrl;
        }
        return;
      }
      const color = palette[collaboratorMap.size % palette.length];
      collaboratorMap.set(id, { name, status, color, avatarUrl });
    };

    if (projectMeta?.owner) {
      const ownerId = projectMeta.owner.id;
      assignCollaborator(
        ownerId != null ? `user-${ownerId}` : `owner-${ownerLabel ?? "unknown"}`,
        ownerLabel,
        currentUserId === projectMeta.owner.id ? "online" : "away",
        projectMeta.owner.avatar_url,
      );
    }

    (projectMeta?.collaborators ?? []).forEach((collaborator) => {
      const collaboratorUser = collaborator.user;
      const collaboratorUserId = collaboratorUser?.id;
      const name =
        collaboratorUser?.username ||
        collaboratorUser?.email ||
        (typeof collaboratorUser?.id === "number"
          ? `User #${collaboratorUser.id}`
          : null);
      const status =
        collaboratorUser?.id && collaboratorUser.id === currentUserId
          ? "online"
          : "away";
      assignCollaborator(
        collaboratorUserId != null
          ? `user-${collaboratorUserId}`
          : `collaborator-${collaborator.id}`,
        name,
        status,
        collaboratorUser?.avatar_url,
      );
    });

    if (currentUser) {
      assignCollaborator(
        `user-${currentUser.id}`,
        currentUser.username || currentUser.email || `User #${currentUser.id}`,
        "online",
        currentUser.avatar_url,
      );
    }

    return Array.from(collaboratorMap.entries()).map(([id, entry]) => ({
      id,
      name: entry.name,
      status: entry.status,
      color: entry.color,
      avatarUrl: entry.avatarUrl,
    }));
  }, [currentUser, currentUserId, ownerLabel, projectMeta?.collaborators, projectMeta?.owner]);

  const onlineCollaboratorCount = useMemo(
    () =>
      workspaceCollaborators.filter(
        (collaborator) => collaborator.status !== "offline",
      ).length,
    [workspaceCollaborators],
  );

  const topbarAvatars = workspaceCollaborators.slice(0, 3);
  const remainingCollaborators = Math.max(
    workspaceCollaborators.length - topbarAvatars.length,
    0,
  );
  const activeFileSaving = Boolean(activeFile?.saving);
  const runButtonDisabled = !activeFile || isRunning || activeFileSaving;
  const backupButtonDisabled =
    readOnlyAccess || !activeFile || activeFileSaving || isBackingUp;
  const backupButtonLabel = readOnlyAccess
    ? "Read only"
    : isBackingUp
      ? "Backing up…"
      : "Backup";
  const runButtonLabel = isRunning ? "Running…" : "Run";
  const projectTitle =
    metaLoading && !projectMeta?.title
      ? "Loading project…"
      : projectMeta?.title ?? "Untitled project";

  return (
    <div className="project-shell">
      <header className="workspace-topbar">
        <div className="workspace-topbar__brand">
          <span className="workspace-topbar__logo">CT</span>
          <button
            type="button"
            className="workspace-topbar__brand-link"
            onClick={handleGoHome}
          >
            <span className="workspace-topbar__title">CodeTogether</span>
            <span className="workspace-topbar__project">
              {projectTitle}
            </span>
          </button>
        </div>

        <div className="workspace-topbar__controls">
          <div className="workspace-topbar__avatars">
            {topbarAvatars.map((collaborator) => {
              const avatarImage = resolveAssetUrl(collaborator.avatarUrl);
              const avatarClassName = avatarImage
                ? "workspace-topbar__avatar workspace-topbar__avatar--image"
                : "workspace-topbar__avatar";

              return (
                <span
                  key={collaborator.id}
                  className={avatarClassName}
                  style={
                    !avatarImage && collaborator.color
                      ? { backgroundColor: collaborator.color }
                      : undefined
                  }
                >
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt={collaborator.name}
                      loading="lazy"
                    />
                  ) : (
                    collaborator.name.charAt(0).toUpperCase()
                  )}
                </span>
              );
            })}
            {remainingCollaborators > 0 && (
              <span className="workspace-topbar__avatar workspace-topbar__avatar--more">
                +{remainingCollaborators}
              </span>
            )}
          </div>

          <span className="workspace-topbar__presence">
            <span className="workspace-topbar__presence-dot" />
            {onlineCollaboratorCount} online
            <span className="workspace-topbar__presence-status">
              {resyncing
                ? "Resyncing…"
                : collaborationStatus === "ready"
                  ? "Live sync"
                  : collaborationStatus === "connecting"
                    ? "Syncing…"
                    : "Offline"}
            </span>
          </span>

          <button
            type="button"
            className="workspace-topbar__button workspace-topbar__button--run"
            onClick={() => {
              void handleRunActiveFile();
            }}
            disabled={runButtonDisabled}
          >
            <span className="workspace-topbar__button-content">
              {isRunning && (
                <span
                  className="button-spinner button-spinner--light"
                  aria-hidden="true"
                />
              )}
              {runButtonLabel}
            </span>
          </button>
          <button
            type="button"
            className="workspace-topbar__button workspace-topbar__button--save"
            onClick={() => {
              void handleBackupFile();
            }}
            disabled={backupButtonDisabled}
          >
            <span className="workspace-topbar__button-content">
              {(activeFileSaving || isBackingUp) && (
                <span className="button-spinner" aria-hidden="true" />
              )}
              {backupButtonLabel}
            </span>
          </button>
          <button
            type="button"
            className="workspace-topbar__button workspace-topbar__button--ghost"
            onClick={handleToggleTerminal}
          >
            {isTerminalOpen ? "Hide Terminal" : "Terminal"}
          </button>
          {isProjectOwner && (
            <button
              type="button"
              className="workspace-topbar__icon-button"
              aria-label="Workspace settings"
              onClick={handleOpenWorkspaceSettings}
            >
              ⚙
            </button>
          )}
          {activeFile?.saveError && (
            <span className="workspace-topbar__error">
              {activeFile.saveError}
            </span>
          )}
        </div>
      </header>

      <div className="project-body">
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          loading={loading}
          error={error}
          onSelect={openFile}
          onRefresh={refresh}
          onCreateFile={handleOpenCreateFile}
          canCreateFiles={Boolean(projectId && currentUserId && canEditProject)}
          projectTitle={projectTitle}
          collaborators={workspaceCollaborators}
        />

        <div className="project-workspace">
          {metaError && (
            <div className="workspace-banner workspace-banner--error">
              {metaError}
            </div>
          )}
          {!metaError && readOnlyBannerVisible && (
            <div className="workspace-banner workspace-banner--info">
              You have read-only access to this project. You can explore files and run code, but edits and saves are disabled.
            </div>
          )}
          {collaborationError && (
            <div className="workspace-banner workspace-banner--error">
              {collaborationError}
            </div>
          )}
          {inviteBanner && (
            <div
              className={`workspace-banner ${
                inviteBanner.tone === "error"
                  ? "workspace-banner--error"
                  : "workspace-banner--info"
              }`}
            >
              {inviteBanner.text}
            </div>
          )}
          {backupBanner && (
            <div
              className={`workspace-banner ${
                backupBanner.tone === "error"
                  ? "workspace-banner--error"
                  : "workspace-banner--info"
              }`}
            >
              {backupBanner.text}
            </div>
          )}
          <FileTabs
            files={openFiles}
            activeFileId={activeFileId}
            onSelect={selectFile}
            onClose={closeFile}
            onCreateFile={handleOpenCreateFile}
            disableCreate={!projectId || !currentUserId || !canEditProject}
          />

          <div className="project-editor">
            <div className="project-editor__canvas">
              <CodeEditor
                file={activeFile}
                loading={loading}
                onChange={handleEditorChange}
                onSave={handleBackupShortcut}
                readOnly={readOnlyAccess}
              />
            </div>
            <div
              className={
                isTerminalOpen
                  ? "terminal-drawer terminal-drawer--open"
                  : "terminal-drawer"
              }
              aria-hidden={!isTerminalOpen}
            >
              <Terminal />
            </div>
          </div>
        </div>
      </div>

      <CreateFileModal
        open={isCreateFileOpen}
        onClose={() => setIsCreateFileOpen(false)}
        onCreate={handleCreateFile}
        disabled={!projectId || !currentUserId || !canEditProject}
      />
      <ProjectSettingsModal
        open={isSettingsOpen}
        onClose={handleCloseWorkspaceSettings}
        project={projectMeta}
        canEdit={canEditProject}
        activeFileId={activeFileId}
        onProjectUpdated={handleProjectUpdated}
      />
      <InviteCollaboratorModal
        open={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        onInvite={handleInviteCollaborator}
      />
    </div>
  );
}

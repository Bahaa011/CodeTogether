/**
 * useProjectWorkspace
 * ---------------------------------------------------------
 * Central orchestrator hook for managing a user's active
 * workspace in a CodeTogether project. Handles:
 * - Project metadata fetching and edit permissions
 * - File operations and synchronization
 * - Realtime collaboration (Socket.IO presence, editing)
 * - Session management for connected users
 * - UI state for modals, banners, and execution
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useProjectEditor } from "./useProjectEditor";
import { useRealtimeCollaboration } from "./useRealtimeCollaboration";
import { emitRunExecutionState, useRunExecutionState } from "./useRunExecutionState";
import { AUTH_USER_EVENT, getStoredUser, type StoredUser } from "../utils/auth";
import { fetchProjectById, type Project } from "../services/projectService";
import { inviteCollaborator } from "../services/collaboratorService";
import { createVersionBackup, revertVersionBackup } from "../services/versionService";
import {
  createSession,
  endSession,
  endSessionBeacon,
  fetchActiveSessions,
  type ProjectSession,
} from "../services/sessionService";
import type { SidebarCollaborator } from "../components/editor/Sidebar";

/** Local state used for banners in workspace UI */
type BannerState =
  | {
      tone: "info" | "error";
      text: string;
    }
  | null;

/** Collaborator color palette used for presence indicators */
const COLLABORATOR_PALETTE = [
  "#2563eb",
  "#9333ea",
  "#f97316",
  "#0ea5e9",
  "#ef4444",
] as const;

/** Construct base API and presence URLs */
const API_BASE_URL =
  (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const PRESENCE_WS_URL = `${API_BASE_URL}/presence`;

/**
 * Main workspace hook: coordinates project editing,
 * collaboration, session lifecycle, and related UI state.
 */
export function useProjectWorkspace(projectId: number | null) {
  /** --- User and Project Meta --- */
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() =>
    getStoredUser(),
  );
  const [projectMeta, setProjectMeta] = useState<Project | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [workspaceCollaborators, setWorkspaceCollaborators] = useState<SidebarCollaborator[]>([]);

  /** --- Realtime and Session References --- */
  const [sessionId, setSessionId] = useState<number | null>(null);
  const collaboratorColorMapRef = useRef(new Map<string, string>());
  const sessionIdRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);
  const presenceSocketRef = useRef<Socket | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);

  /** Session key for persistence between reloads */
  const sessionStorageKey = useMemo(
    () => (projectId ? `project-session:${projectId}` : null),
    [projectId],
  );

  /**
   * Assigns or reuses a unique color for each collaborator.
   * Cycles through a small fixed palette for deterministic mapping.
   */
  const getCollaboratorColor = useCallback((key: string) => {
    const existing = collaboratorColorMapRef.current.get(key);
    if (existing) return existing;

    const color =
      COLLABORATOR_PALETTE[
        collaboratorColorMapRef.current.size % COLLABORATOR_PALETTE.length
      ];
    collaboratorColorMapRef.current.set(key, color);
    return color;
  }, []);

  /**
   * Keeps the stored user in sync across browser tabs.
   * Listens for AUTH_USER_EVENT or localStorage changes.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

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

  /**
   * Fetches project metadata and ownership information.
   * Sets project details, or error message if retrieval fails.
   */
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
        if (!cancelled) {
          setProjectMeta(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Unable to load project.";
          setMetaError(message);
          setProjectMeta(null);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };

    void loadProjectMeta();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /** --- Ownership and Permissions --- */
  const currentUserId = currentUser?.id ?? null;
  const ownerId = projectMeta?.owner?.id ?? projectMeta?.ownerId ?? null;
  const isProjectOwner = ownerId !== null && ownerId === currentUserId;

  /** Checks if user has edit rights (owner or collaborator) */
  const canEditProject = useMemo(() => {
    if (!currentUserId || !projectMeta) return false;
    if (isProjectOwner) return true;

    return (
      projectMeta.collaborators?.some(
        (collaborator) => collaborator.user?.id === currentUserId,
      ) ?? false
    );
  }, [currentUserId, isProjectOwner, projectMeta]);

  const readOnlyAccess = !canEditProject;
  const readOnlyBannerVisible = Boolean(projectMeta) && readOnlyAccess;

  /** --- File and Editor State --- */
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
    deleteFile: removeProjectFile,
  } = useProjectEditor(projectId, currentUserId);

  /** --- Realtime Collaboration --- */
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

  /** --- UI and Modals --- */
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const openCreateFileModal = useCallback(() => {
    if (!readOnlyAccess) setIsCreateFileOpen(true);
  }, [readOnlyAccess]);
  const closeCreateFileModal = useCallback(() => setIsCreateFileOpen(false), []);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const closeInviteModal = useCallback(() => setIsInviteModalOpen(false), []);

  const [inviteBanner, setInviteBanner] = useState<BannerState>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const isRunning = useRunExecutionState();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupBanner, setBackupBanner] = useState<BannerState>(null);
  const [revertingVersionId, setRevertingVersionId] = useState<number | null>(
    null,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /** Reset banners when project changes */
  useEffect(() => {
    setInviteBanner(null);
    setIsInviteModalOpen(false);
  }, [projectId]);

  /** Listen for external invite modal events */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleInviteRequest = () => {
      if (isProjectOwner) setIsInviteModalOpen(true);
    };

    window.addEventListener("invite-collaborator", handleInviteRequest);
    return () => {
      window.removeEventListener("invite-collaborator", handleInviteRequest);
    };
  }, [isProjectOwner]);

  /** Reset backup banner when switching active files */
  useEffect(() => {
    setBackupBanner(null);
  }, [activeFileId]);

  /** --- File Interaction Handlers --- */

  /** Syncs draft changes locally and broadcasts via collaboration socket */
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!activeFileId || readOnlyAccess) return;
      updateDraft(activeFileId, value);
      emitCollaborativeChange(value);
    },
    [activeFileId, emitCollaborativeChange, readOnlyAccess, updateDraft],
  );

  /** Creates a new file if user has write access */
  const handleCreateFile = useCallback(
    async ({ filename, content }: { filename: string; content: string }) => {
      if (readOnlyAccess) {
        throw new Error("You do not have permission to create files in this project.");
      }
      await createFile({ filename, content });
      setIsCreateFileOpen(false);
    },
    [createFile, readOnlyAccess],
  );

  /**
   * Creates a version backup for the active file.
   * Opens a prompt for naming the backup, saves it to the database,
   * and displays a banner with the result.
   */
  const handleBackupFile = useCallback(async () => {
    if (!activeFile || readOnlyAccess || typeof window === "undefined") return;

    const defaultLabel = `Backup ${new Date().toLocaleString()}`;
    const labelInput = window.prompt("Name this backup", defaultLabel);
    if (labelInput === null) return;

    const trimmedLabel = labelInput.trim();
    if (!trimmedLabel) {
      window.alert("Give this backup a name so you can find it later.");
      return;
    }

    setIsBackingUp(true);
    try {
      await createVersionBackup({
        fileId: activeFile.id,
        content: activeFile.draftContent ?? "",
        userId: currentUserId ?? undefined,
        label: trimmedLabel,
      });
      setBackupBanner({ tone: "info", text: `Backup "${trimmedLabel}" created.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create backup.";
      setBackupBanner({ tone: "error", text: message });
    } finally {
      setIsBackingUp(false);
    }
  }, [activeFile, currentUserId, readOnlyAccess]);

  const handleBackupShortcut = useCallback(() => {
    void handleBackupFile();
  }, [handleBackupFile]);

  /** Deletes a file and updates UI banners accordingly */
  const handleDeleteFile = useCallback(
    async (fileId: number) => {
      if (readOnlyAccess) {
        setBackupBanner({
          tone: "error",
          text: "You do not have permission to delete files in this project.",
        });
        return;
      }

      try {
        await removeProjectFile(fileId);
        setBackupBanner({ tone: "info", text: "File deleted." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete file.";
        setBackupBanner({ tone: "error", text: message });
      }
    },
    [readOnlyAccess, removeProjectFile],
  );

  /**
   * Reverts a file to a previous version backup.
   * Updates content using syncFileContent and updates banners.
   */
  const handleRevertBackup = useCallback(
    async (versionId: number, fileId?: number | null) => {
      const targetFileId = fileId ?? activeFileId;
      if (!targetFileId) {
        setBackupBanner({ tone: "error", text: "Select a file to revert." });
        return;
      }

      setRevertingVersionId(versionId);
      try {
        const revertedFile = await revertVersionBackup(versionId);
        if (revertedFile?.id) {
          syncFileContent(revertedFile.id, revertedFile.content ?? "", true);
        }
        setBackupBanner({ tone: "info", text: "File reverted to selected backup." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to revert backup.";
        setBackupBanner({ tone: "error", text: message });
      } finally {
        setRevertingVersionId(null);
      }
    },
    [activeFileId, syncFileContent],
  );

  /** --- Workspace Panels and Settings --- */
  const openWorkspaceSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeWorkspaceSettings = useCallback(() => setIsSettingsOpen(false), []);

  /**
   * Sends an invitation to collaborate on the project.
   * Updates banner with success or error feedback.
   */
  const handleInviteCollaborator = useCallback(
    async (identifier: string) => {
      if (!projectId || !currentUserId) {
        throw new Error("You need to be signed in to send invitations.");
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
          error instanceof Error ? error.message : "Failed to send invitation.";
        setInviteBanner({ tone: "error", text: message });
        throw new Error(message);
      }
    },
    [currentUserId, projectId],
  );

  /** Updates workspace metadata when project info changes */
  const handleProjectUpdated = useCallback((next: Project) => {
    setProjectMeta(next);
  }, []);
  /**
   * Executes the active file in the terminal.
   * Ensures unsaved changes are saved first, then dispatches
   * a `run-file-requested` event to the window for terminal handling.
   */
  const handleRunActiveFile = useCallback(async () => {
    if (!activeFile) return;

    const payload = {
      fileId: activeFile.id,
      filename: activeFile.filename,
      code: activeFile.draftContent ?? "",
      fileType: activeFile.file_type,
      language: activeFile.file_type,
    };

    emitRunExecutionState(true);

    if (!readOnlyAccess && (activeFile.dirty || activeFile.saveError)) {
      const saved = await saveFile(activeFile.id);
      if (!saved) {
        emitRunExecutionState(false);
        return;
      }
    }

    setIsTerminalOpen(true);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("run-file-requested", { detail: payload }),
      );
    }
  }, [activeFile, readOnlyAccess, saveFile]);

  /** Toggles the terminal panel visibility */
  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen((open) => !open);
  }, []);

  /** Displays readable owner label in top bar */
  const ownerLabel = useMemo(() => {
    const owner = projectMeta?.owner;
    if (!owner) return null;
    return owner.username || owner.email || `User #${owner.id}`;
  }, [projectMeta?.owner]);

  /**
   * Builds a base collaborator map from the project owner,
   * collaborators, and current user.
   * Used as a baseline before merging live session updates.
   */
  const buildBaseCollaborators = useCallback(() => {
    const baseMap = new Map<string, SidebarCollaborator>();

    const assign = (
      id: string,
      name: string | null | undefined,
      avatarUrl?: string | null,
      status: SidebarCollaborator["status"] = "offline",
    ) => {
      if (!name) return;
      baseMap.set(id, {
        id,
        name,
        status,
        avatarUrl,
        color: getCollaboratorColor(id),
      });
    };

    if (projectMeta?.owner) {
      const ownerIdValue = projectMeta.owner.id;
      assign(
        ownerIdValue != null ? `user-${ownerIdValue}` : "owner",
        ownerLabel,
        projectMeta.owner.avatar_url,
      );
    }

    const getInviteIdentifier = (collab: any): string | null => {
      if (!collab) return null;
      return (
        collab.inviteIdentifier ||
        collab.invite_identifier ||
        collab.inviteEmail ||
        collab.invite_email ||
        null
      );
    };

    (projectMeta?.collaborators ?? []).forEach((collaborator) => {
      const collaboratorUser = collaborator.user;
      const collaboratorUserId = collaboratorUser?.id;
      const inviteIdentifier = getInviteIdentifier(collaborator);
      const displayName =
        collaboratorUser?.username ||
        collaboratorUser?.email ||
        (collaboratorUserId != null
          ? `User #${collaboratorUserId}`
          : inviteIdentifier || null);
      assign(
        collaboratorUserId != null
          ? `user-${collaboratorUserId}`
          : `collaborator-${collaborator.id}`,
        displayName,
        collaboratorUser?.avatar_url,
      );
    });

    if (currentUser) {
      assign(
        `user-${currentUser.id}`,
        currentUser.username || currentUser.email || `User #${currentUser.id}`,
        currentUser.avatar_url,
      );
    }

    return baseMap;
  }, [currentUser, getCollaboratorColor, ownerLabel, projectMeta?.collaborators, projectMeta?.owner]);

  /**
   * Updates the live collaborator list from active session data.
   * Merges session presence with the base collaborator list.
   */
  const updateCollaboratorsFromSessions = useCallback(
    (sessions: ProjectSession[]) => {
      const baseMap = buildBaseCollaborators();
      sessions.forEach((session) => {
        const participant = session.user;
        const userId = participant?.id ?? null;
        const key =
          userId != null ? `user-${userId}` : `session-${session.id}`;
        const name =
          participant?.username ||
          participant?.email ||
          (userId != null ? `User #${userId}` : "Guest");
        const status: SidebarCollaborator["status"] =
          session.status === "active" ? "online" : "away";

        const existing = baseMap.get(key);
        if (existing) {
          existing.status = status;
          if (!existing.avatarUrl && participant?.avatar_url) {
            existing.avatarUrl = participant.avatar_url;
          }
        } else {
          baseMap.set(key, {
            id: key,
            name,
            status,
            color: getCollaboratorColor(key),
            avatarUrl: participant?.avatar_url,
          });
        }
      });

      setWorkspaceCollaborators(Array.from(baseMap.values()));
    },
    [buildBaseCollaborators, getCollaboratorColor],
  );

  /** Initializes collaborator list with empty session state */
  useEffect(() => {
    updateCollaboratorsFromSessions([]);
  }, [updateCollaboratorsFromSessions]);

  /**
   * Ends the current session and cleans up associated state:
   * - Disconnects from presence socket
   * - Clears heartbeat intervals and local storage
   * - Attempts a graceful session termination via beacon or API
   */
  const endCurrentSession = useCallback(() => {
    if (!sessionActiveRef.current) return;

    sessionActiveRef.current = false;
    const previousSessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    setSessionId(null);

    const presenceSocket = presenceSocketRef.current;
    if (presenceSocket) {
      if (previousSessionId) {
        presenceSocket.emit("presence:leave", { sessionId: previousSessionId });
      }
      presenceSocket.disconnect();
      presenceSocketRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (sessionStorageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(sessionStorageKey);
    }

    if (!previousSessionId) return;
    if (endSessionBeacon(previousSessionId)) return;
    void endSession(previousSessionId).catch(() => undefined);
  }, [sessionStorageKey]);

  /**
   * Cleans up stale sessions from previous browser sessions.
   * Ensures no dangling server-side sessions remain active.
   */
  const recoverStaleSession = useCallback(async () => {
    if (!sessionStorageKey || typeof window === "undefined") return;

    const storedSession = window.localStorage.getItem(sessionStorageKey);
    const restoredId = storedSession ? Number(storedSession) : NaN;
    if (!Number.isFinite(restoredId) || restoredId <= 0) {
      window.localStorage.removeItem(sessionStorageKey);
      return;
    }

    try {
      if (!endSessionBeacon(restoredId)) {
        await endSession(restoredId);
      }
    } catch {
      // Ignore cleanup errors
    } finally {
      window.localStorage.removeItem(sessionStorageKey);
      setSessionId(null);
    }
  }, [sessionStorageKey]);

  /**
   * Handles session creation and cleanup lifecycle.
   * Creates a new session when the user opens the project,
   * and ends it when the page unloads or loses visibility.
   */
  useEffect(() => {
    if (
      !projectId ||
      !currentUserId ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      sessionIdRef.current = null;
      sessionActiveRef.current = false;
      if (sessionStorageKey && typeof window !== "undefined") {
        window.localStorage.removeItem(sessionStorageKey);
      }
      return () => {};
    }

    let cancelled = false;

    const startSession = async () => {
      await recoverStaleSession();
      try {
        const session = await createSession({
          userId: currentUserId,
          projectId,
        });
        if (cancelled || !session) return;
        sessionIdRef.current = session.id;
        sessionActiveRef.current = true;
        if (sessionStorageKey) {
          window.localStorage.setItem(sessionStorageKey, String(session.id));
        }
        setSessionId(session.id);
      } catch (error) {
        console.error("Failed to create session", error);
      }
    };

    void startSession();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        endCurrentSession();
      }
    };

    window.addEventListener("beforeunload", endCurrentSession);
    window.addEventListener("pagehide", endCurrentSession);
    window.addEventListener("unload", endCurrentSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", endCurrentSession);
      window.removeEventListener("pagehide", endCurrentSession);
      window.removeEventListener("unload", endCurrentSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      endCurrentSession();
    };
  }, [
    currentUserId,
    endCurrentSession,
    projectId,
    recoverStaleSession,
    sessionStorageKey,
  ]);

  /**
   * Establishes and maintains presence socket connection.
   * Keeps collaborator presence up-to-date via `presence:update` events,
   * with periodic heartbeats to indicate the session is active.
   */
  useEffect(() => {
    if (!projectId || !sessionId || typeof window === "undefined") {
      if (presenceSocketRef.current) {
        presenceSocketRef.current.disconnect();
        presenceSocketRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    const socket = io(PRESENCE_WS_URL, {
      transports: ["websocket"],
    });
    presenceSocketRef.current = socket;

    const sendHeartbeat = () => {
      socket.emit("presence:heartbeat", { sessionId });
    };

    const handleConnect = () => {
      socket.emit("presence:join", { sessionId });
      sendHeartbeat();
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = window.setInterval(sendHeartbeat, 10000);
    };

    const handleUpdate = (payload: {
      projectId?: number;
      sessions?: ProjectSession[];
    }) => {
      if (payload?.projectId !== projectId) return;
      updateCollaboratorsFromSessions(payload.sessions ?? []);
    };

    const handleError = (payload: { message?: string }) => {
      console.warn("Presence socket error:", payload?.message);
    };

    socket.on("connect", handleConnect);
    socket.on("presence:update", handleUpdate);
    socket.on("presence:error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("presence:update", handleUpdate);
      socket.off("presence:error", handleError);
      socket.emit("presence:leave", { sessionId });
      socket.disconnect();

      if (presenceSocketRef.current === socket) {
        presenceSocketRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [projectId, sessionId, updateCollaboratorsFromSessions]);

  /**
   * Loads active sessions when opening the workspace.
   * Provides initial collaborator presence before realtime sync.
   */
  useEffect(() => {
    if (!projectId || typeof window === "undefined") {
      collaboratorColorMapRef.current.clear();
      setWorkspaceCollaborators([]);
      return () => {};
    }

    let cancelled = false;
    collaboratorColorMapRef.current.clear();

    const loadSessions = async () => {
      try {
        const sessions = await fetchActiveSessions(projectId);
        if (!cancelled) {
          updateCollaboratorsFromSessions(sessions);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch active sessions", error);
        }
      }
    };

    void loadSessions();

    return () => {
      cancelled = true;
      setWorkspaceCollaborators([]);
      collaboratorColorMapRef.current.clear();
    };
  }, [projectId, updateCollaboratorsFromSessions]);

  /** --- Derived UI States --- */
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
  const runButtonLabel = isRunning ? "Running…" : "Run";

  const backupButtonDisabled =
    readOnlyAccess || !activeFile || activeFileSaving || isBackingUp;
  const backupButtonLabel = readOnlyAccess
    ? "Read only"
    : isBackingUp
      ? "Backing up…"
      : "Backup";

  const projectTitle =
    metaLoading && !projectMeta?.title
      ? "Loading project…"
      : projectMeta?.title ?? "Untitled project";

  /** --- Public API --- */
  return {
    projectMeta,
    projectTitle,
    metaLoading,
    metaError,
    isProjectOwner,
    canEditProject,
    readOnlyAccess,
    readOnlyBannerVisible,
    currentUserId,
    files,
    openFiles,
    activeFile,
    loading,
    error,
    openFile,
    closeFile,
    selectFile,
    refresh,
    activeFileId,
    collaborationError,
    collaborationStatus,
    resyncing,
    handleEditorChange,
    handleCreateFile,
    openCreateFileModal,
    closeCreateFileModal,
    isCreateFileOpen,
    closeInviteModal,
    isInviteModalOpen,
    inviteBanner,
    handleInviteCollaborator,
    handleBackupFile,
    handleBackupShortcut,
    isBackingUp,
    backupBanner,
    openWorkspaceSettings,
    closeWorkspaceSettings,
    isSettingsOpen,
    handleProjectUpdated,
    handleRunActiveFile,
    toggleTerminal,
    isTerminalOpen,
    isRunning,
    runButtonDisabled,
    runButtonLabel,
    backupButtonDisabled,
    backupButtonLabel,
    activeFileSaving,
    ownerLabel,
    workspaceCollaborators,
    onlineCollaboratorCount,
    topbarAvatars,
    remainingCollaborators,
    handleRevertBackup,
    revertingVersionId,
    handleDeleteFile,
  };
}

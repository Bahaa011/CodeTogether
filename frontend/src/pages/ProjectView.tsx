import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FileTabs from "../components/editor/FileTabs";
import CodeEditor from "../components/editor/CodeEditor";
import CreateFileModal from "../components/modal/CreateFileModal";
import InviteCollaboratorModal from "../components/modal/InviteCollaboratorModal";
import ProjectSettingsModal from "../components/modal/ProjectSettingsModal";
import Terminal from "../components/editor/Terminal";
import ConfirmationDialog from "../components/modal/ConfirmationDialog";
import { useProjectWorkspace } from "../hooks/useProjectWorkspace";
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

  const {
    projectMeta,
    projectTitle,
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
    isBackingUp,
    workspaceCollaborators,
    onlineCollaboratorCount,
    topbarAvatars,
    remainingCollaborators,
    handleRevertBackup,
    revertingVersionId,
    handleDeleteFile,
  } = useProjectWorkspace(projectId);

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

  const handleGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const [filePendingDeleteId, setFilePendingDeleteId] = useState<number | null>(
    null,
  );
  const filePendingDelete = useMemo(
    () =>
      files.find((file) => file.id === filePendingDeleteId) ??
      openFiles.find((file) => file.id === filePendingDeleteId),
    [filePendingDeleteId, files, openFiles],
  );

  const handleConfirmDeleteFile = useCallback(async () => {
    if (!filePendingDelete) {
      return;
    }
    try {
      await handleDeleteFile(filePendingDelete.id);
    } finally {
      setFilePendingDeleteId(null);
    }
  }, [filePendingDelete, handleDeleteFile]);

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
            onClick={toggleTerminal}
          >
            {isTerminalOpen ? "Hide Terminal" : "Terminal"}
          </button>
          {isProjectOwner && (
            <button
              type="button"
              className="workspace-topbar__icon-button"
              aria-label="Workspace settings"
              onClick={openWorkspaceSettings}
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
          onCreateFile={openCreateFileModal}
          canCreateFiles={Boolean(projectId && currentUserId && canEditProject)}
          onDeleteFile={
            isProjectOwner ? (fileId) => setFilePendingDeleteId(fileId) : undefined
          }
          canDeleteFiles={isProjectOwner}
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
            onCreateFile={openCreateFileModal}
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
        onClose={closeCreateFileModal}
        onCreate={handleCreateFile}
        disabled={!projectId || !currentUserId || !canEditProject}
      />
      <ProjectSettingsModal
        open={isSettingsOpen}
        onClose={closeWorkspaceSettings}
        project={projectMeta}
        canEdit={canEditProject}
        canDeleteProject={isProjectOwner}
        onProjectDeleted={() => {
          closeWorkspaceSettings();
          navigate("/");
        }}
        activeFileId={activeFileId}
        onProjectUpdated={handleProjectUpdated}
        onRevertBackup={handleRevertBackup}
        revertingVersionId={revertingVersionId}
      />
      <InviteCollaboratorModal
        open={isInviteModalOpen}
        onClose={closeInviteModal}
        onInvite={handleInviteCollaborator}
      />
      <ConfirmationDialog
        open={Boolean(filePendingDelete)}
        mode="confirm"
        tone="danger"
        title="Delete file"
        message={
          filePendingDelete
            ? `Delete ${filePendingDelete.filename}? This removes it for the entire project.`
            : ""
        }
        confirmLabel="Delete file"
        cancelLabel="Keep file"
        onCancel={() => setFilePendingDeleteId(null)}
        onConfirm={handleConfirmDeleteFile}
      />
    </div>
  );
}

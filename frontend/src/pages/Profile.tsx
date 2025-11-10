/**
 * Profile Page
 * -------------
 * Displays user profile details, statistics, and project history.
 *
 * Features:
 * - Shows user info (avatar, bio, contact email, member since)
 * - Displays metrics such as project count, collaborations, and deep work sessions
 * - Tabbed panels for Projects and Collaborations
 * - Allows profile editing, avatar upload, and logout (for own profile)
 * - Provides collaboration removal with confirmation dialog
 *
 * Behavior:
 * - Uses `useProfileData` for self view or `useUserProfileData` for viewing others
 * - Protects own profile behind authentication
 * - Syncs project and collaboration stats in real time
 */

import { useCallback, useState } from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { resolveAssetUrl } from "../utils/url";
import { useProfileData, useUserProfileData } from "../hooks/useProfileData";
import { removeCollaborator } from "../services/collaboratorService";
import EditProfileModal from "../components/modal/EditProfileModal";
import ConfirmationDialog from "../components/modal/ConfirmationDialog";
import { type Project } from "../services/projectService";
import "../styles/profile.css";

/**
 * getProjectTags
 * ----------------
 * Helper function that extracts and filters tag names from a project object.
 */
const getProjectTags = (project?: Project) =>
  project?.tags?.map((tag) => tag?.tag).filter(Boolean) ?? [];

export default function Profile() {
  /**
   * Routing & Context
   * ------------------
   * Retrieves optional userId from the URL to determine
   * whether viewing own profile or another user’s profile.
   */
  const { userId } = useParams<{ userId?: string }>();
  const location = useLocation();
  const viewingOther = Boolean(userId);

  /**
   * Data Source
   * ------------
   * Selects appropriate profile hook based on whether the user
   * is viewing their own or another profile.
   */
  const profileData = viewingOther
    ? useUserProfileData(Number(userId))
    : useProfileData();

  /**
   * Extract shared profile fields:
   * - user info, loading/error state, projects, collaborations, and stats.
   */
  const {
    user,
    loading,
    error,
    stats,
    statsLoading,
    projects,
    projectsLoading,
    projectsError,
    collaborations,
    collaborationsLoading,
    collaborationsError,
  } = profileData;

  /**
   * Auth-only handlers and fields (only for own profile).
   */
  const hasToken =
    "hasToken" in profileData ? profileData.hasToken : undefined;
  const handleLogout =
    "handleLogout" in profileData ? profileData.handleLogout : undefined;
  const handleSaveProfile =
    "handleSaveProfile" in profileData ? profileData.handleSaveProfile : undefined;
  const handleUploadAvatar =
    "handleUploadAvatar" in profileData ? profileData.handleUploadAvatar : undefined;

  /**
   * UI State Management
   * --------------------
   * Controls active tab view, modals, and pending collaboration removals.
   */
  const [activeTab, setActiveTab] = useState<"projects" | "collaborations">("projects");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [pendingRemovalId, setPendingRemovalId] = useState<number | null>(null);

  /**
   * handleRemoveCollaboration
   * --------------------------
   * Removes a collaborator from a project and refreshes the view.
   */
  const handleRemoveCollaboration = async (collaborationId: number) => {
    try {
      await removeCollaborator(collaborationId);
      window.location.reload();
    } catch (error) {
      console.error("Failed to remove collaboration:", error);
    } finally {
      setPendingRemovalId(null);
    }
  };

  /**
   * handleContact
   * --------------
   * Opens the default mail client to contact the user.
   */
  const handleContact = useCallback(() => {
    if (user?.email) {
      window.open(`mailto:${user.email}`, "_blank");
    }
  }, [user?.email]);

  /**
   * Redirect Guard
   * ---------------
   * Redirects unauthenticated users away from their own profile.
   */
  if (!viewingOther && !hasToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  /**
   * Loading & Error States
   * -----------------------
   * Displays appropriate feedback while fetching or if data fails to load.
   */
  if (loading) {
    return (
      <div className="profile-page">
        <section className="profile-status-card">
          <p className="profile-status-text">Loading profile…</p>
        </section>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-page">
        <section className="profile-status-card">
          <p className="profile-status-text">
            {error ?? "Unable to load profile."}
          </p>
        </section>
      </div>
    );
  }

  /**
   * Derived Data
   * -------------
   * Builds secondary display data such as avatar letter, bio text, join date,
   * and computed metrics for monthly project creation.
   */
  const avatarLetter =
    user.username?.[0]?.toUpperCase() ??
    user.email?.[0]?.toUpperCase() ??
    "U";
  const avatarImageSrc = resolveAssetUrl(user.avatar_url);
  const bioText =
    user?.bio?.trim() && user.bio.trim().length > 0
      ? user.bio.trim()
      : "This user hasn’t added a bio yet.";
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;

  /** Calculates number of projects created in the current month. */
  const getProjectsThisMonth = () => {
    if (projectsLoading || !projects) return 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return projects.filter((project) => {
      if (!project.created_at) return false;
      const created = new Date(project.created_at);
      return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;
  };

  const projectsThisMonth = getProjectsThisMonth();

  /** Profile statistics cards. */
  const metrics = [
    {
      key: "projects",
      title: "Total Projects",
      value: statsLoading ? "…" : stats.projects,
      footnote: statsLoading ? "" : `+${projectsThisMonth} this month`,
    },
    {
      key: "collaborations",
      title: "Collaborations",
      value: statsLoading ? "…" : stats.collaborations,
      footnote: statsLoading ? "" : "Keep building together",
    },
    {
      key: "sessions",
      title: "Deep Work Sessions",
      value: statsLoading ? "…" : stats.sessions,
      footnote: statsLoading ? "" : "15+ min focused collaborations",
    },
  ];

  /**
   * renderProjectsPanel
   * --------------------
   * Renders user’s project list or appropriate placeholders.
   */
  const renderProjectsPanel = () => {
    if (projectsLoading)
      return <p className="profile-panel-placeholder">Loading projects…</p>;
    if (projectsError)
      return <p className="profile-panel-placeholder">{projectsError}</p>;
    if (projects.length === 0)
      return (
        <p className="profile-panel-placeholder">
          {viewingOther
            ? `${user.username ?? "This user"} hasn’t published any projects yet.`
            : "Projects you create will appear here."}
        </p>
      );

    return (
      <ul className="profile-project-list">
        {projects.map((project) => {
          const tags = getProjectTags(project);
          return (
            <li key={project.id} className="profile-project-item">
              <a href={`/projects/${project.id}`} className="profile-project-link">
                <div className="profile-project-heading">
                  <h3 className="profile-project-title">{project.title}</h3>
                  <span
                    className={
                      project.is_public
                        ? "profile-project-badge profile-project-badge--public"
                        : "profile-project-badge"
                    }
                  >
                    {project.is_public ? "Public" : "Private"}
                  </span>
                </div>
                <p className="profile-project-description">
                  {project.description || "No description provided."}
                </p>
                {tags.length > 0 && (
                  <div className="profile-project-tags">
                    {tags.map((tag) => (
                      <span key={tag} className="profile-project-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="profile-project-meta">
                  Updated{" "}
                  {project.updated_at
                    ? new Date(project.updated_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "recently"}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    );
  };

  /**
   * renderCollaborationsPanel
   * --------------------------
   * Displays collaborations with the option to remove participation.
   */
  const renderCollaborationsPanel = () => {
    if (collaborationsLoading)
      return <p className="profile-panel-placeholder">Loading collaborations…</p>;
    if (collaborationsError)
      return <p className="profile-panel-placeholder">{collaborationsError}</p>;
    if (collaborations.length === 0)
      return (
        <p className="profile-panel-placeholder">
          {viewingOther
            ? "Collaborations will appear once this user joins shared projects."
            : "Collaborations you join will appear here."}
        </p>
      );

    return (
      <ul className="profile-project-list">
        {collaborations.map((collab) => {
          const project = collab.project;
          const tags = getProjectTags(project);
          return (
            <li key={collab.id} className="profile-project-item">
              <div className="profile-project-row">
                <a
                  href={project?.id ? `/projects/${project.id}` : "#"}
                  className={
                    project?.id
                      ? "profile-project-link"
                      : "profile-project-link profile-project-link--disabled"
                  }
                >
                  <div className="profile-project-heading">
                    <h3 className="profile-project-title">
                      {project?.title ?? "Untitled project"}
                    </h3>
                    <span
                      className={
                        project?.is_public
                          ? "profile-project-badge profile-project-badge--public"
                          : "profile-project-badge"
                      }
                    >
                      {project?.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                  <p className="profile-project-description">
                    {project?.description ?? "No description provided."}
                  </p>
                  {tags.length > 0 && (
                    <div className="profile-project-tags">
                      {tags.map((tag) => (
                        <span key={tag} className="profile-project-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
                <button
                  type="button"
                  className="profile-project-remove"
                  onClick={(e) => {
                    e.preventDefault();
                    setPendingRemovalId(collab.id);
                  }}
                  title="Stop collaborating"
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  /**
   * JSX Return
   * -----------
   * Main render function that composes hero, metrics, and content panels.
   */
  return (
    <div className="profile-page">
      {/* ------------------ Hero Section ------------------ */}
      <section className="profile-hero">
        <div className="profile-hero-main">
          <div className="profile-hero-avatar">
            {avatarImageSrc ? (
              <img
                src={avatarImageSrc}
                alt={`${user.username ?? user.email} avatar`}
                className="profile-hero-image"
              />
            ) : (
              <span className="profile-hero-letter">{avatarLetter}</span>
            )}
            <span className="profile-hero-status" aria-hidden />
          </div>

          <div className="profile-hero-details">
            <div className="profile-hero-heading">
              <h1 className="profile-hero-name">
                {user.username ?? user.email}
              </h1>
              {user.email && (
                <span className="profile-hero-email">{user.email}</span>
              )}
            </div>
            <p className="profile-hero-subtitle">{bioText}</p>
            <div className="profile-hero-meta">
              {memberSince && (
                <>
                  <span className="profile-hero-meta-item">
                    Member since {memberSince}
                  </span>
                  <span className="profile-hero-meta-bullet" />
                </>
              )}
              <span className="profile-hero-meta-item profile-hero-meta-online">
                {viewingOther ? "Active" : "Online"}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Actions */}
        <div className="profile-hero-actions">
          {viewingOther ? (
            <button
              type="button"
              className="profile-hero-button"
              onClick={handleContact}
            >
              Contact
            </button>
          ) : (
            <>
              <button
                type="button"
                className="profile-hero-button"
                onClick={() => setIsEditProfileOpen(true)}
              >
                Edit Profile
              </button>
              <button
                type="button"
                className="profile-hero-button profile-hero-button--ghost"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          )}
        </div>
      </section>

      {/* ------------------ Metrics ------------------ */}
      <section className="profile-metrics">
        {metrics.map((metric) => (
          <article key={metric.key} className="profile-metric-card">
            <span className="profile-metric-value">{metric.value}</span>
            <h2 className="profile-metric-title">{metric.title}</h2>
            {metric.footnote && (
              <p className="profile-metric-footnote">{metric.footnote}</p>
            )}
          </article>
        ))}
      </section>

      {/* ------------------ Tabs ------------------ */}
      <section className="profile-sections">
        <article className="profile-panel profile-panel--tabs">
          <header className="profile-tab-header">
            <nav className="profile-tab-bar">
              <button
                className={
                  activeTab === "projects"
                    ? "profile-tab-button profile-tab-button--active"
                    : "profile-tab-button"
                }
                onClick={() => setActiveTab("projects")}
              >
                <span>Projects</span>
                <span className="profile-tab-count">{stats.projects}</span>
              </button>
              <button
                className={
                  activeTab === "collaborations"
                    ? "profile-tab-button profile-tab-button--active"
                    : "profile-tab-button"
                }
                onClick={() => setActiveTab("collaborations")}
              >
                <span>Collaborations</span>
                <span className="profile-tab-count">
                  {stats.collaborations}
                </span>
              </button>
            </nav>
          </header>

          <div className="profile-tab-body">
            {activeTab === "projects"
              ? renderProjectsPanel()
              : renderCollaborationsPanel()}
          </div>
        </article>

        {/* ------------------ Activity ------------------ */}
        <article className="profile-panel profile-panel--activity">
          <header className="profile-panel-header">
            <h2 className="profile-panel-title">Recent Activity</h2>
          </header>
          <p className="profile-panel-placeholder">
            {viewingOther
              ? "Recent commits and notes for this user will appear here."
              : "Keep building! Your recent commits and merges will surface here soon."}
          </p>
        </article>
      </section>

      {/* ------------------ Modals ------------------ */}
      {!viewingOther && (
        <EditProfileModal
          open={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          initialBio={user.bio ?? ""}
          initialAvatarUrl={user.avatar_url}
          onSave={handleSaveProfile!}
          onUploadAvatar={handleUploadAvatar!}
        />
      )}

      {pendingRemovalId && (
        <ConfirmationDialog
          open={true}
          mode="confirm"
          tone="danger"
          title="Leave Project"
          message={`Are you sure you want to stop collaborating on "${collaborations.find(c => c.id === pendingRemovalId)?.project?.title || "this project"}"? You'll need a new invitation to rejoin.`}
          confirmLabel="Leave Project"
          cancelLabel="Cancel"
          onConfirm={() => handleRemoveCollaboration(pendingRemovalId)}
          onCancel={() => setPendingRemovalId(null)}
        />
      )}
    </div>
  );
}

import { useCallback, useState } from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { resolveAssetUrl } from "../utils/url";
import { useProfileData, useUserProfileData } from "../hooks/useProfileData";
import EditProfileModal from "../components/modal/EditProfileModal";
import { type Project } from "../services/projectService";
import "../styles/profile.css";

const getProjectTags = (project?: Project) =>
  project?.tags?.map((tag) => tag?.tag).filter(Boolean) ?? [];

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const location = useLocation();
  const viewingOther = Boolean(userId);

  // Choose which hook to use
  const profileData = viewingOther
    ? useUserProfileData(Number(userId))
    : useProfileData();

  // Shared fields
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

  // Auth-only fields (exist only for own profile)
  const hasToken =
    "hasToken" in profileData ? profileData.hasToken : undefined;
  const handleLogout =
    "handleLogout" in profileData ? profileData.handleLogout : undefined;
  const handleSaveProfile =
    "handleSaveProfile" in profileData ? profileData.handleSaveProfile : undefined;
  const handleUploadAvatar =
    "handleUploadAvatar" in profileData ? profileData.handleUploadAvatar : undefined;

  const [activeTab, setActiveTab] = useState<"projects" | "collaborations">(
    "projects"
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const handleContact = useCallback(() => {
    if (user?.email) {
      window.open(`mailto:${user.email}`, "_blank");
    }
  }, [user?.email]);

  // Redirect if not logged in and viewing own profile
  if (!viewingOther && !hasToken) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

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

  const metrics = [
  {
    key: "projects",
    title: "Total Projects",
    value: statsLoading ? "…" : stats.projects,
    footnote: statsLoading
      ? ""
      : viewingOther
      ? "+0 this month" // You can customize this later if you want user-specific
      : "+0 this month",
  },
  {
    key: "collaborations",
    title: "Collaborations",
    value: statsLoading ? "…" : stats.collaborations,
    footnote: statsLoading
      ? ""
      : "Keep building together",
  },
  {
    key: "sessions",
    title: "Deep Work Sessions",
    value: statsLoading ? "…" : stats.sessions,
    footnote: statsLoading
      ? ""
      : "15+ min focused collaborations",
  },
];


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

  const renderCollaborationsPanel = () => {
    if (collaborationsLoading)
      return (
        <p className="profile-panel-placeholder">
          Loading collaborations…
        </p>
      );
    if (collaborationsError)
      return (
        <p className="profile-panel-placeholder">{collaborationsError}</p>
      );
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
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="profile-page">
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
    </div>
  );
}

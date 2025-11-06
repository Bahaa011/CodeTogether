import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchProfile } from "../services/authService";
import {
  fetchProjectCount,
  fetchProjectsByOwner,
  type Project,
} from "../services/projectService";
import {
  fetchCollaborationCount,
  fetchCollaborationsByUser,
  type UserCollaboration,
} from "../services/collaboratorService";
import { updateUserProfile, uploadUserAvatar } from "../services/userService";
import {
  AUTH_TOKEN_EVENT,
  getStoredUser,
  getToken,
  removeToken,
  setRole,
  setStoredUser,
  type StoredUser,
} from "../utils/auth";
import EditProfileModal from "../components/EditProfileModal";
import { resolveAssetUrl } from "../utils/url";
import "../styles/profile.css";

export default function Profile() {
  const location = useLocation();
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(() => hasToken && !user);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "collaborations">(
    "projects",
  );
  const [stats, setStats] = useState({ projects: 0, collaborations: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [collaborations, setCollaborations] = useState<UserCollaboration[]>([]);
  const [collaborationsLoading, setCollaborationsLoading] = useState(false);
  const [collaborationsError, setCollaborationsError] = useState<
    string | null
  >(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    const syncTokenState = () => {
      const tokenPresent = Boolean(getToken());
      setHasToken(tokenPresent);
      if (!tokenPresent) {
        setUser(null);
        setStoredUser(null);
        setRole(null);
      }
    };

    window.addEventListener(AUTH_TOKEN_EVENT, syncTokenState);
    window.addEventListener("storage", syncTokenState);

    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT, syncTokenState);
      window.removeEventListener("storage", syncTokenState);
    };
  }, []);

  useEffect(() => {
    if (!hasToken) {
      return;
    }

    let cancelled = false;
    const cachedUser = getStoredUser();
    if (!cachedUser) {
      setLoading(true);
    }

    const loadProfile = async () => {
      try {
        const profile = await fetchProfile();
        if (cancelled) return;
        setUser(profile);
        setStoredUser(profile);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unable to load profile.";
        setError(message);
        removeToken();
        setStoredUser(null);
        setRole(null);
        setHasToken(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  useEffect(() => {
    if (!hasToken || !user?.id) {
      setActiveTab("projects");
      setStats({ projects: 0, collaborations: 0 });
      setProjects([]);
      setCollaborations([]);
      return;
    }

    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);

    setProjectsLoading(true);
    setProjectsError(null);

    setCollaborationsLoading(true);
    setCollaborationsError(null);
    setCollaborations([]);

    const load = async () => {
      try {
        const [
          projectsCount,
          collaborationsCount,
          ownedProjects,
          userCollaborations,
        ] = await Promise.all([
          fetchProjectCount(user.id),
          fetchCollaborationCount(user.id),
          fetchProjectsByOwner(user.id),
          fetchCollaborationsByUser(user.id),
        ]);
        if (cancelled) return;
        setStats({
          projects: projectsCount,
          collaborations: collaborationsCount,
        });
        setProjects(ownedProjects);
        setCollaborations(userCollaborations);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unable to load statistics.";
        setStatsError(message);
        setStats({ projects: 0, collaborations: 0 });
        setProjectsError(message);
        setProjects([]);
        setCollaborationsError(message);
        setCollaborations([]);
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
          setProjectsLoading(false);
          setCollaborationsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [hasToken, user?.id]);

  const handleLogout = () => {
    removeToken();
    setStoredUser(null);
    setRole(null);
    setUser(null);
    setHasToken(false);
  };

  const handleSaveProfile = useCallback(
    async (updates: { bio?: string; avatar_url?: string }) => {
      if (!user?.id) {
        throw new Error("Unable to update profile without a user ID.");
      }
      const updatedUser = await updateUserProfile(user.id, updates);
      const mergedUser = { ...user, ...updatedUser };
      setUser(mergedUser);
      setStoredUser(mergedUser);
    },
    [user],
  );

  const handleUploadAvatar = useCallback(
    async (file: File) => {
      if (!user?.id) {
        throw new Error("Unable to upload avatar without a user ID.");
      }
      const updatedUser = await uploadUserAvatar(user.id, file);
      setUser(updatedUser);
      setStoredUser(updatedUser);
      return updatedUser.avatar_url ?? undefined;
    },
    [user],
  );

  if (!hasToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <section className="profile-status-card">
          <p className="profile-status-text">Loading profile...</p>
        </section>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-page">
        <section className="profile-status-card">
          <p className="profile-status-text">{error}</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const avatarLetter =
    user.username?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase() ?? "U";
  const avatarImageSrc = resolveAssetUrl(user.avatar_url);
  const bioText =
    typeof user.bio === "string" && user.bio.trim().length > 0
      ? user.bio.trim()
      : "This user hasn't added a bio yet.";
  const memberSince =
    user.created_at != null
      ? new Date(user.created_at).toLocaleString(undefined, { month: "short", year: "numeric" })
      : null;

  const metrics = [
    {
      key: "projects",
      title: "Total Projects",
      value: statsLoading ? "..." : stats.projects,
      footnote: statsLoading ? "" : "+0 this month",
    },
    {
      key: "collaborations",
      title: "Collaborations",
      value: statsLoading ? "..." : stats.collaborations,
      footnote: statsLoading ? "" : "Keep building together",
    },
    {
      key: "placeholder",
      title: "Coming Soon",
      value: "--",
      footnote: "More insights on the way",
    },
  ];

  const renderProjectsPanel = () => {
    if (projectsLoading) {
      return (
        <p className="profile-panel-placeholder">
          Loading your projects…
        </p>
      );
    }

    if (projectsError) {
      return <p className="profile-panel-placeholder">{projectsError}</p>;
    }

    if (projects.length === 0) {
      return (
        <p className="profile-panel-placeholder">
          Projects you create will appear here with activity snapshots and quick access.
        </p>
      );
    }

    return (
      <ul className="profile-project-list">
        {projects.map((project) => (
          <li key={project.id} className="profile-project-item">
            <a className="profile-project-link" href={`/projects/${project.id}`}>
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
        ))}
      </ul>
    );
  };

  const renderCollaborationsPanel = () => {
    if (collaborationsLoading) {
      return (
        <p className="profile-panel-placeholder">
          Loading collaborations…
        </p>
      );
    }

    if (collaborationsError) {
      return <p className="profile-panel-placeholder">{collaborationsError}</p>;
    }

    if (collaborations.length === 0) {
      return (
        <p className="profile-panel-placeholder">
          Collaborations you join will appear here with shared project details and owners.
        </p>
      );
    }

    return (
      <ul className="profile-project-list">
        {collaborations.map((collaboration) => {
          const project = collaboration.project;
          const projectTitle = project?.title ?? "Untitled project";
          const projectDescription =
            project?.description && project.description.trim().length > 0
              ? project.description
              : "No description provided.";
          const projectHref = project?.id ? `/projects/${project.id}` : "#";
          const isPublic = project?.is_public === true;
          const badgeClass = isPublic
            ? "profile-project-badge profile-project-badge--public"
            : "profile-project-badge";
          const badgeLabel = project
            ? isPublic
              ? "Public"
              : "Private"
            : "Unavailable";
          const joinedAt = collaboration.added_at
            ? new Date(collaboration.added_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : null;
          const ownerLabel =
            project?.owner?.username ||
            project?.owner?.email ||
            (project?.ownerId ? `User #${project.ownerId}` : null);
          const metaParts = [
            `Role: ${collaboration.role ?? "Collaborator"}`,
            joinedAt ? `Joined ${joinedAt}` : "Joined recently",
          ];
          if (ownerLabel) {
            metaParts.push(`Owner: ${ownerLabel}`);
          }

          return (
            <li key={collaboration.id} className="profile-project-item">
              <a
                className={
                  project?.id
                    ? "profile-project-link"
                    : "profile-project-link profile-project-link--disabled"
                }
                href={projectHref}
                aria-disabled={project?.id ? undefined : true}
              >
                <div className="profile-project-heading">
                  <h3 className="profile-project-title">{projectTitle}</h3>
                  <span className={badgeClass}>{badgeLabel}</span>
                </div>
                <p className="profile-project-description">
                  {projectDescription}
                </p>
                <span className="profile-project-meta">
                  {metaParts.join(" • ")}
                </span>
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
                alt={`${user.username} avatar`}
                className="profile-hero-image"
              />
            ) : (
              <span className="profile-hero-letter">{avatarLetter}</span>
            )}
            <span className="profile-hero-status" aria-hidden />
          </div>
          <div className="profile-hero-details">
            <div className="profile-hero-heading">
              <h1 className="profile-hero-name">{user.username}</h1>
              <span className="profile-hero-email">{user.email}</span>
            </div>
            <p className="profile-hero-subtitle">{bioText}</p>
            <div className="profile-hero-meta">
              {memberSince && (
                <>
                  <span className="profile-hero-meta-item">Member since {memberSince}</span>
                  <span className="profile-hero-meta-bullet" />
                </>
              )}
              <span className="profile-hero-meta-item profile-hero-meta-online">Online</span>
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            type="button"
            className="profile-hero-button"
            onClick={() => setIsEditProfileOpen(true)}
          >
            Edit Profile
          </button>
          <button type="button" className="profile-hero-button profile-hero-button--ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </section>

      <section className="profile-metrics">
        {metrics.map((metric) => (
          <article key={metric.key} className="profile-metric-card">
            <span className="profile-metric-value">{metric.value}</span>
            <h2 className="profile-metric-title">{metric.title}</h2>
            {metric.footnote && <p className="profile-metric-footnote">{metric.footnote}</p>}
          </article>
        ))}
      </section>
      {statsError && !statsLoading && (
        <p className="profile-metric-error" role="status">
          {statsError}
        </p>
      )}

      <section className="profile-sections">
        <article className="profile-panel profile-panel--tabs">
          <header className="profile-tab-header">
            <nav className="profile-tab-bar" aria-label="Project panels">
              <button
                type="button"
                className={
                  activeTab === "projects"
                    ? "profile-tab-button profile-tab-button--active"
                    : "profile-tab-button"
                }
                onClick={() => setActiveTab("projects")}
              >
                <span>My Projects</span>
                <span className="profile-tab-count">{stats.projects}</span>
              </button>
              <button
                type="button"
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
            Keep building! Your latest commits, merges, and comments will surface here once available.
          </p>
        </article>
      </section>

      <EditProfileModal
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialBio={user.bio}
        initialAvatarUrl={user.avatar_url}
        onSave={handleSaveProfile}
        onUploadAvatar={handleUploadAvatar}
      />
    </div>
  );
}

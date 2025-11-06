import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProjects, type Project } from "../services/projectService";
import "../styles/home.css";

type FilterId = "trending" | "recent" | "popular" | "collaborative";

const FILTER_OPTIONS: Array<{ id: FilterId; label: string; icon: string }> = [
  { id: "trending", label: "Trending", icon: "🔥" },
  { id: "recent", label: "Recent", icon: "🆕" },
  { id: "popular", label: "Most Popular", icon: "⭐" },
  { id: "collaborative", label: "Collaborative", icon: "🤝" },
];

const ICON_TONES = ["magenta", "blue", "orange", "violet", "amber", "cyan", "green"];

function getIconTone(projectId: number) {
  return ICON_TONES[Math.abs(projectId) % ICON_TONES.length] ?? "magenta";
}

function getProjectInitials(title: string) {
  const initials = title
    .trim()
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "PR";
}

function getOwnerLabel(project: Project) {
  const username = project.owner?.username;
  if (username && username.trim().length > 0) {
    return username.startsWith("@") ? username : `@${username}`;
  }
  if (project.owner?.email) {
    return project.owner.email;
  }
  if (project.ownerId) {
    return `Owner #${project.ownerId}`;
  }
  return "Unknown owner";
}

function toTimestamp(value?: string) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function formatUpdatedLabel(value?: string) {
  if (!value) return null;
  const timestamp = toTimestamp(value);
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("trending");

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchProjects();
        if (cancelled) return;
        setProjects(data);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unable to load projects.";
        setError(message);
        setProjects([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const heroStats = useMemo(() => {
    const totalProjects = projects.length;
    const developerIds = new Set<number>();
    let collaborationCount = 0;

    projects.forEach((project) => {
      if (project.owner?.id) {
        developerIds.add(project.owner.id);
      } else if (project.ownerId) {
        developerIds.add(project.ownerId);
      }

      project.collaborators?.forEach((collaborator) => {
        if (collaborator.user?.id) {
          developerIds.add(collaborator.user.id);
        }
      });

      collaborationCount += project.collaborators?.length ?? 0;
    });

    const formatStat = (value: number) =>
      value > 0 ? `${value.toLocaleString()}+` : "0";

    return [
      { label: "Active Projects", value: formatStat(totalProjects) },
      { label: "Developers", value: formatStat(developerIds.size) },
      { label: "Collaborations", value: formatStat(collaborationCount) },
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects.length) {
      return [];
    }

    switch (activeFilter) {
      case "trending":
        return [...projects].sort(
          (a, b) =>
            toTimestamp(b.updated_at ?? b.created_at) -
            toTimestamp(a.updated_at ?? a.created_at),
        );
      case "recent":
        return [...projects].sort(
          (a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at),
        );
      case "popular":
        return [...projects].sort(
          (a, b) =>
            (b.collaborators?.length ?? 0) - (a.collaborators?.length ?? 0),
        );
      case "collaborative":
        return projects
          .filter((project) => (project.collaborators?.length ?? 0) > 0)
          .sort(
            (a, b) =>
              (b.collaborators?.length ?? 0) - (a.collaborators?.length ?? 0),
          );
      default:
        return projects;
    }
  }, [projects, activeFilter]);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">CodeTogether</p>
          <h1 className="home-hero__title">Discover Amazing Projects</h1>
          <p className="home-hero__subtitle">
            Explore trending projects, collaborate with developers, and find
            inspiration for your next build.
          </p>
        </div>

        <div className="home-hero__stats">
          {heroStats.map((stat) => (
            <div key={stat.label} className="home-stat">
              <span className="home-stat__value">{stat.value}</span>
              <span className="home-stat__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="home-toolbar">
        <div className="home-filters">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`home-filter${filter.id === activeFilter ? " is-active" : ""}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <span className="home-filter__icon" aria-hidden="true">
                {filter.icon}
              </span>
              {filter.label}
            </button>
          ))}
        </div>

        <div className="home-toolbar__actions">
          <button className="home-select" type="button">
            All Technologies
            <span aria-hidden="true">▾</span>
          </button>
          <button className="home-filter-toggle" type="button" aria-label="Filter options">
            <span aria-hidden="true">⚙️</span>
          </button>
        </div>
      </div>

      <div className="home-projects">
        {loading && <div className="home-feedback">Loading projects…</div>}
        {error && !loading && (
          <div className="home-feedback home-feedback--error">{error}</div>
        )}

        {!loading && !error && filteredProjects.length === 0 && (
          <div className="home-feedback">No projects available yet.</div>
        )}

        {!loading &&
          !error &&
          filteredProjects.map((project) => {
            const tags =
              project.tags
                ?.map((tag) => tag?.tag)
                .filter(isNonEmptyString) ?? [];
            const collaboratorCount = project.collaborators?.length ?? 0;
            const visibilityLabel = project.is_public ? "Public" : "Private";
            const updatedLabel = formatUpdatedLabel(
              project.updated_at ?? project.created_at,
            );
            const iconTone = getIconTone(project.id);
            const initials = getProjectInitials(project.title);
            const ownerLabel = getOwnerLabel(project);

            return (
              <article key={project.id} className="home-project">
                <header className="home-project__header">
                  <div
                    className={`home-project__icon tone-${iconTone}`}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div className="home-project__meta">
                    <h3 className="home-project__title">{project.title}</h3>
                    <p className="home-project__author">by {ownerLabel}</p>
                  </div>
                </header>

                <p className="home-project__description">{project.description}</p>

                <footer className="home-project__footer">
                  <div className="home-project__tags">
                    {tags.map((tag) => (
                      <span key={tag} className="home-project__tag">
                        {tag}
                      </span>
                    ))}
                    <span className="home-project__stat">
                      👥 {collaboratorCount.toLocaleString()}
                    </span>
                    <span className="home-project__stat">{visibilityLabel}</span>
                    {updatedLabel && (
                      <span className="home-project__stat">
                        Updated {updatedLabel}
                      </span>
                    )}
                  </div>

                  <Link className="home-project__cta" to={`/projects/${project.id}`}>
                    View Project →
                  </Link>
                </footer>
              </article>
            );
          })}
      </div>
    </div>
  );
}

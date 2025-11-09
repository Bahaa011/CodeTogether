import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { type Project } from "../services/projectService";
import { PROJECT_TAG_OPTIONS } from "../utils/projectTags";
import {
  useExploreProjects,
  type ExploreFilterId,
} from "../hooks/useExploreProjects";
import { isNonEmptyString, toTimestamp } from "../utils/projectFilters";
import "../styles/explore.css";

const FILTER_OPTIONS: Array<{
  id: ExploreFilterId;
  label: string;
  icon: string;
}> = [
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

export default function Explore() {
  const PAGE_SIZE = 6;
  const {
    projects,
    filteredProjects,
    loading,
    error,
    activeFilter,
    setActiveFilter,
    activeTags,
    toggleTag,
    clearTags,
    heroStats,
  } = useExploreProjects();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filteredProjects]);

  useEffect(() => {
    if (!loadMoreRef.current) {
      return;
    }

    const target = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => {
              if (prev >= filteredProjects.length) {
                return prev;
              }
              return Math.min(filteredProjects.length, prev + PAGE_SIZE);
            });
          }
        });
      },
      { rootMargin: "200px" },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [filteredProjects.length]);

  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const hasMoreProjects = visibleCount < filteredProjects.length;
  const handleManualLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(filteredProjects.length, prev + PAGE_SIZE),
    );
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <section className="home-hero">
          <div className="home-hero__content">
            <p className="home-hero__eyebrow">Build With People Who Care</p>
            <h1 className="home-hero__title">
              Curated projects and collaborators in one focused feed.
            </h1>
            <p className="home-hero__subtitle">
              Browse what&apos;s trending, jump into active collaborations, or
              showcase your own work. Every repo here is looking for momentum.
            </p>
            <div className="home-hero__actions">
              <Link className="home-hero__cta" to="/playground">
                Open Playground
              </Link>
              <button
                className="home-hero__ghost"
                type="button"
                onClick={() =>
                  window.scrollTo({ top: document.body.offsetHeight / 3, behavior: "smooth" })
                }
              >
                See what&apos;s new
              </button>
            </div>
          </div>
          <div className="home-hero__panel">
            {heroStats.map((stat) => (
              <article key={stat.label} className="home-stat-card">
                <span className="home-stat-card__label">{stat.label}</span>
                <span className="home-stat-card__value">{stat.value}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="home-discovery">
          <header className="home-discovery__header">
            <div>
              <p className="home-section-eyebrow">Discovery</p>
              <h2 className="home-section-title">Tune the feed to your mood</h2>
              <p className="home-section-subtitle">
                Pick a feed style and optionally focus on topics that match your curiosity.
              </p>
            </div>
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
          </header>

          <div className="home-tag-filter">
            <div className="home-tag-filter__label-row">
              <span className="home-tag-filter__label">Topics</span>
              {activeTags.length > 0 && (
                <button
                  type="button"
                  className="home-clear-tags"
                  onClick={clearTags}
                >
                  Clear tags
                </button>
              )}
            </div>
            <div className="home-tag-filter__options">
              {PROJECT_TAG_OPTIONS.map((tag) => {
                const isActive = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`home-tag-chip${isActive ? " is-active" : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="home-grid-section">
          <header className="home-grid-header">
            <div>
              <p className="home-section-eyebrow">Projects</p>
              <h2 className="home-section-title">Fresh from the community</h2>
            </div>
            <span className="home-grid-count">
              {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"}
            </span>
          </header>

          <div className="home-projects">
            {loading && <div className="home-feedback">Loading projects…</div>}
            {error && !loading && (
              <div className="home-feedback home-feedback--error">{error}</div>
            )}

            {!loading && !error && filteredProjects.length === 0 && (
              <div className="home-feedback">
                {projects.length === 0
                  ? "No projects available yet."
                  : "No projects match the selected filters."}
              </div>
            )}

            {!loading &&
              !error &&
              visibleProjects.map((project) => {
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
                      {updatedLabel && (
                        <span className="home-project__status">
                          Updated {updatedLabel}
                        </span>
                      )}
                    </header>

                    <p className="home-project__description">{project.description}</p>

                    <div className="home-project__tags">
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <span key={tag} className="home-project__tag">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="home-project__tag home-project__tag--muted">
                          No tags yet
                        </span>
                      )}
                    </div>

                    <footer className="home-project__footer">
                      <div className="home-project__stats">
                        <span className="home-project__stat">
                          👥 {collaboratorCount.toLocaleString()} {collaboratorCount === 1 ? "collaborator" : "collaborators"}
                        </span>
                        <span className="home-project__stat">{visibilityLabel}</span>
                      </div>

                      <Link className="home-project__cta" to={`/projects/${project.id}`}>
                        View Project
                      </Link>
                    </footer>
                  </article>
                );
              })}
          </div>
          {hasMoreProjects && (
            <div className="home-load-more" ref={loadMoreRef}>
              <p>Keep scrolling to load more projects.</p>
              <button type="button" onClick={handleManualLoadMore}>
                Load more now
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

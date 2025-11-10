/**
 * Explore Page
 * -------------
 * Displays the public discovery feed of CodeTogether projects.
 *
 * Features:
 * - Browse trending, recent, and collaborative projects
 * - Filter by category and tags
 * - Infinite scrolling with IntersectionObserver
 * - Tag-based filtering synced with active feed type
 * - Responsive stats panel and lazy "Load More" logic
 *
 * Components:
 * - useExploreProjects: Custom hook handling data fetching, filters, and tag state
 * - PROJECT_TAG_OPTIONS: Predefined list of topics to refine the feed
 * - Dynamic card list rendering similar to Profile.tsx project grid
 */

import { useEffect, useRef, useState } from "react";
import { PROJECT_TAG_OPTIONS } from "../utils/projectTags";
import {
  useExploreProjects,
  type ExploreFilterId,
} from "../hooks/useExploreProjects";
import { isNonEmptyString } from "../utils/projectFilters";
import "../styles/explore.css";
import "../styles/load-more.css";

/**
 * FILTER_OPTIONS
 * ----------------
 * Available discovery filters for the Explore feed:
 * - "Most Popular" → highlights high-engagement projects
 * - "Recent" → shows the latest created or updated projects
 * - "Collaborative" → showcases projects with multiple contributors
 */
const FILTER_OPTIONS: Array<{
  id: ExploreFilterId;
  label: string;
  icon: string;
}> = [
  { id: "popular", label: "Most Popular", icon: "⭐" },
  { id: "recent", label: "Recent", icon: "🆕" },
  { id: "collaborative", label: "Collaborative", icon: "🤝" },
];

/**
 * Explore Component
 * -------------------
 * Main page for browsing and discovering community projects.
 * Includes:
 * - Hero section with platform stats
 * - Filter controls and topic tags
 * - Paginated project feed with infinite scrolling
 */
export default function Explore() {
  /** Number of projects to show per scroll batch */
  const PAGE_SIZE = 6;

  /**
   * useExploreProjects Hook
   * -------------------------
   * Handles fetching and filtering logic for Explore feed.
   * Returns:
   * - All projects and filtered subset
   * - Loading and error states
   * - Active filter & tag state management
   */
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

  /** Number of currently visible projects */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  /**
   * Reset visible count whenever filters change.
   */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filteredProjects]);

  /**
   * Infinite Scrolling Logic
   * -------------------------
   * Observes the "load more" marker to dynamically append new projects
   * as the user scrolls. Increases visibleCount by PAGE_SIZE each trigger.
   */
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const target = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) =>
              Math.min(filteredProjects.length, prev + PAGE_SIZE)
            );
          }
        });
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredProjects.length]);

  /** Derived display values */
  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const hasMoreProjects = visibleCount < filteredProjects.length;

  /** Manual fallback in case auto-load doesn’t trigger */
  const handleManualLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(filteredProjects.length, prev + PAGE_SIZE)
    );
  };

  /**
   * JSX Return
   * ------------
   * Structured layout sections:
   * 1. Hero – tagline and live community stats
   * 2. Discovery – feed filters and tag selector
   * 3. Project Grid – cards for each filtered project
   * 4. Infinite Loader – optional “Load More” trigger
   */
  return (
    <div className="home-page">
      <div className="home-container">
        {/* ------------------ Hero Section ------------------ */}
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
              <button
                className="home-hero__ghost"
                type="button"
                onClick={() =>
                  window.scrollTo({
                    top: document.body.offsetHeight / 3,
                    behavior: "smooth",
                  })
                }
              >
                See what&apos;s new
              </button>
            </div>
          </div>

          {/* Stats cards from backend */}
          <div className="home-hero__panel">
            {heroStats.map((stat) => (
              <article key={stat.label} className="home-stat-card">
                <span className="home-stat-card__label">{stat.label}</span>
                <span className="home-stat-card__value">{stat.value}</span>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------ Discovery Section ------------------ */}
        <section className="home-discovery">
          <header className="home-discovery__header">
            <div>
              <p className="home-section-eyebrow">Discovery</p>
              <h2 className="home-section-title">Tune the feed to your mood</h2>
              <p className="home-section-subtitle">
                Pick a feed style and optionally focus on topics that match your curiosity.
              </p>
            </div>

            {/* Filter Buttons */}
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

          {/* Tag Chips */}
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

        {/* ------------------ Projects Grid ------------------ */}
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

          {/* Project Feed */}
          <div className="profile-panel profile-panel--tabs">
            {loading && <p className="profile-panel-placeholder">Loading projects…</p>}

            {error && !loading && (
              <p className="profile-panel-placeholder">{error}</p>
            )}

            {!loading && !error && filteredProjects.length === 0 && (
              <p className="profile-panel-placeholder">
                {projects.length === 0
                  ? "No projects available yet."
                  : "No projects match the selected filters."}
              </p>
            )}

            {!loading && !error && filteredProjects.length > 0 && (
              <ul className="profile-project-list">
                {visibleProjects.map((project) => {
                  const tags =
                    project.tags?.map((tag) => tag?.tag).filter(isNonEmptyString) ?? [];

                  return (
                    <li key={project.id} className="profile-project-item">
                      <a
                        href={`/projects/${project.id}`}
                        className="profile-project-link"
                      >
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
            )}
          </div>

          {/* Infinite Loader */}
          {hasMoreProjects && (
            <div className="load-more-container" ref={loadMoreRef}>
              <p className="load-more-text">
                Keep scrolling to load more projects.
              </p>
              <button
                type="button"
                onClick={handleManualLoadMore}
                className="load-more-button"
              >
                Load more now
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

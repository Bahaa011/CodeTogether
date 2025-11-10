/**
 * useExploreProjects Hook
 *
 * Provides logic for fetching, filtering, and sorting public projects
 * in the Explore page.
 *
 * Responsibilities:
 * - Fetch projects from the backend via projectService.
 * - Manage project filters (recent, popular, collaborative).
 * - Allow tag-based filtering and resetting.
 * - Compute derived statistics for the Explore hero section.
 * - Expose a filtered list of projects ready for rendering.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProjects, type Project } from "../services/projectService";
import { isNonEmptyString, toTimestamp } from "../utils/projectFilters";

/**
 * ExploreFilterId
 *
 * Enumerates available sorting/filtering options for the Explore view:
 * - "recent": Sort projects by creation date (newest first).
 * - "popular": Sort by collaborator count (most collaborators first).
 * - "collaborative": Show only projects with collaborators, sorted by collaborator count.
 */
export type ExploreFilterId = "recent" | "popular" | "collaborative";

/**
 * useExploreProjects
 *
 * Main hook used in the Explore page to manage project data and filters.
 *
 * Returns:
 * - projects: All fetched projects.
 * - filteredProjects: Filtered and sorted project list based on tags and filter type.
 * - loading: Indicates whether data is currently being fetched.
 * - error: Contains an error message if fetching fails.
 * - activeFilter: Currently selected sort/filter mode.
 * - setActiveFilter: Function to update the active filter mode.
 * - activeTags: List of active tag filters.
 * - toggleTag: Toggles a tag on or off from the filter.
 * - clearTags: Clears all active tags.
 * - heroStats: Computed metrics for displaying summary statistics.
 */
export function useExploreProjects() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] =
    useState<ExploreFilterId>("popular");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Tag Filter Management
  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((value) => value !== tag);
      }
      return [...prev, tag];
    });
  }, []);

  const clearTags = useCallback(() => {
    setActiveTags([]);
  }, []);

  // Fetch Projects
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

  // Derived Hero Statistics
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

  // Tag + Filter Logic
  const filteredProjects = useMemo(() => {
    // Filter by tags
    const tagFiltered =
      activeTags.length === 0
        ? projects
        : projects.filter((project) => {
            const tags =
              project.tags
                ?.map((tag) => tag?.tag)
                .filter(isNonEmptyString) ?? [];
            return activeTags.every((tag) => tags.includes(tag));
          });

    if (!tagFiltered.length) return [];

    // Apply sorting or filtering mode
    switch (activeFilter) {
      case "recent":
        // Sort by creation date (newest first)
        return [...tagFiltered].sort(
          (a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at),
        );
      case "popular":
        // Sort by number of collaborators (most collaborators first)
        return [...tagFiltered].sort(
          (a, b) =>
            (b.collaborators?.length ?? 0) - (a.collaborators?.length ?? 0),
        );
      case "collaborative":
        // Filter to only show projects with collaborators, then sort by collaborator count
        return tagFiltered
          .filter((project) => (project.collaborators?.length ?? 0) > 0)
          .sort(
            (a, b) =>
              (b.collaborators?.length ?? 0) - (a.collaborators?.length ?? 0),
          );
      default:
        return tagFiltered;
    }
  }, [projects, activeFilter, activeTags]);

  // Return API
  return {
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
  };
}

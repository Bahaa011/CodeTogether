import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProjects, type Project } from "../services/projectService";
import { isNonEmptyString, toTimestamp } from "../utils/projectFilters";

export type ExploreFilterId =
  | "trending"
  | "recent"
  | "popular"
  | "collaborative";

export function useExploreProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] =
    useState<ExploreFilterId>("trending");
  const [activeTags, setActiveTags] = useState<string[]>([]);

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

    if (!tagFiltered.length) {
      return [];
    }

    switch (activeFilter) {
      case "trending":
        return [...tagFiltered].sort(
          (a, b) =>
            toTimestamp(b.updated_at ?? b.created_at) -
            toTimestamp(a.updated_at ?? a.created_at),
        );
      case "recent":
        return [...tagFiltered].sort(
          (a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at),
        );
      case "popular":
        return [...tagFiltered].sort(
          (a, b) =>
            (b.collaborators?.length ?? 0) - (a.collaborators?.length ?? 0),
        );
      case "collaborative":
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

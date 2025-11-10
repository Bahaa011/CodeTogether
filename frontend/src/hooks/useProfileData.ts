/**
 * useProfileData Hooks Suite
 *
 * A collection of hooks responsible for fetching, managing, and updating
 * user profile data — both private (authenticated user) and public (viewed profiles).
 *
 * Responsibilities:
 * - Retrieve and synchronize the logged-in user's profile.
 * - Fetch and aggregate portfolio data (projects, collaborations, sessions).
 * - Handle profile updates and avatar uploads.
 * - Provide a public-facing hook for viewing another user’s profile and work.
 */

import { useCallback, useEffect, useState } from "react";
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
import {
  fetchUserById,
  updateUserProfile,
  uploadUserAvatar,
  type UserProfile as PublicUserProfile,
} from "../services/userService";
import { fetchLongSessionCount } from "../services/sessionService";
import {
  AUTH_TOKEN_EVENT,
  getStoredUser,
  getToken,
  removeToken,
  setRole,
  setStoredUser,
  type StoredUser,
} from "../utils/auth";

/**
 * ProfileStats
 *
 * Represents the numerical statistics displayed on a user’s profile.
 * - projects: Number of owned projects.
 * - collaborations: Number of projects where the user collaborates.
 * - sessions: Number of long coding sessions by the user.
 */
export type ProfileStats = {
  projects: number;
  collaborations: number;
  sessions: number;
};

/**
 * ProfilePortfolioState
 *
 * Captures the full data state of a user's portfolio,
 * including loading/error flags and project/collaboration lists.
 */
type ProfilePortfolioState = {
  stats: ProfileStats;
  statsLoading: boolean;
  statsError: string | null;
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  collaborations: UserCollaboration[];
  collaborationsLoading: boolean;
  collaborationsError: string | null;
};

/**
 * UseProfilePortfolioOptions
 *
 * Options controlling when and how to fetch portfolio data.
 * - userId: ID of the user to fetch data for.
 * - enabled: Whether data fetching is active.
 * - errorMessage: Optional custom error message.
 */
type UseProfilePortfolioOptions = {
  userId: number | null;
  enabled: boolean;
  errorMessage?: string;
};

/**
 * UseProfileDataResult
 *
 * Combines user account info, portfolio data, and profile mutation handlers.
 */
type UseProfileDataResult = {
  hasToken: boolean;
  user: StoredUser | null;
  loading: boolean;
  error: string | null;
} & ProfilePortfolioState & {
    handleLogout(): void;
    handleSaveProfile(
      updates: { bio?: string; avatar_url?: string | null },
    ): Promise<void>;
    handleUploadAvatar(file: File): Promise<string>;
  };

/**
 * UsePublicProfileDataResult
 *
 * Public-facing read-only version of user profile and portfolio data.
 */
type UsePublicProfileDataResult = {
  user: PublicUserProfile | null;
  loading: boolean;
  error: string | null;
} & ProfilePortfolioState;

/**
 * useProfilePortfolio
 *
 * Internal helper hook responsible for fetching a user's portfolio:
 * - Project and collaboration lists.
 * - Aggregate statistics (projects, collaborations, sessions).
 *
 * Automatically resets when disabled or `userId` is null.
 */
function useProfilePortfolio({
  userId,
  enabled,
  errorMessage = "Unable to load statistics.",
}: UseProfilePortfolioOptions): ProfilePortfolioState {
  const [stats, setStats] = useState<ProfileStats>({
    projects: 0,
    collaborations: 0,
    sessions: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [collaborations, setCollaborations] = useState<UserCollaboration[]>([]);
  const [collaborationsLoading, setCollaborationsLoading] = useState(false);
  const [collaborationsError, setCollaborationsError] = useState<string | null>(
    null,
  );

  /**
   * Effect: Fetch all portfolio data (counts, projects, collaborations)
   * when the hook is enabled and a valid user ID is provided.
   */
  useEffect(() => {
    if (!enabled || !userId) {
      // Reset all data when disabled
      setStats({ projects: 0, collaborations: 0, sessions: 0 });
      setStatsError(null);
      setStatsLoading(false);

      setProjects([]);
      setProjectsError(null);
      setProjectsLoading(false);

      setCollaborations([]);
      setCollaborationsError(null);
      setCollaborationsLoading(false);
      return;
    }

    let cancelled = false;
    setStatsLoading(true);
    setProjectsLoading(true);
    setCollaborationsLoading(true);
    setStatsError(null);
    setProjectsError(null);
    setCollaborationsError(null);

    const load = async () => {
      try {
        const [
          projectsCount,
          collaborationsCount,
          longSessionCount,
          ownedProjects,
          userCollaborations,
        ] = await Promise.all([
          fetchProjectCount(userId),
          fetchCollaborationCount(userId),
          fetchLongSessionCount(userId),
          fetchProjectsByOwner(userId),
          fetchCollaborationsByUser(userId),
        ]);

        if (cancelled) return;
        setStats({
          projects: projectsCount,
          collaborations: collaborationsCount,
          sessions: longSessionCount,
        });
        setProjects(ownedProjects);
        setCollaborations(userCollaborations);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : errorMessage;
        setStats({ projects: 0, collaborations: 0, sessions: 0 });
        setStatsError(message);
        setProjectsError(message);
        setCollaborationsError(message);
        setProjects([]);
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
  }, [enabled, errorMessage, userId]);

  return {
    stats,
    statsLoading,
    statsError,
    projects,
    projectsLoading,
    projectsError,
    collaborations,
    collaborationsLoading,
    collaborationsError,
  };
}

/**
 * useProfileData
 *
 * Hook for managing the currently authenticated user's full profile state.
 *
 * Responsibilities:
 * - Sync login token state across tabs and localStorage.
 * - Load, cache, and update user profile information.
 * - Manage profile portfolio (projects, collaborations, sessions).
 * - Handle profile updates and avatar uploads.
 */
export function useProfileData(): UseProfileDataResult {
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(() => hasToken && !user);
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect: Keep token state synchronized across tabs and events.
   */
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

  /**
   * Effect: Fetch authenticated user's profile from API.
   * Falls back to local storage cache if available.
   */
  useEffect(() => {
    if (!hasToken) {
      setUser(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const cachedUser = getStoredUser();
    if (!cachedUser) setLoading(true);

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
        if (!cancelled) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  // Fetch portfolio statistics for authenticated user
  const portfolio = useProfilePortfolio({
    userId: user?.id ?? null,
    enabled: hasToken && Boolean(user?.id),
  });

  /** Logs out the user and clears local authentication state. */
  const handleLogout = useCallback(() => {
    removeToken();
    setStoredUser(null);
    setRole(null);
    setUser(null);
    setHasToken(false);
  }, []);

  /**
   * handleSaveProfile
   *
   * Updates the authenticated user's bio or avatar URL.
   */
  const handleSaveProfile = useCallback(
    async (updates: { bio?: string; avatar_url?: string | null }) => {
      if (!user?.id) throw new Error("Unable to update profile without a user ID.");
      const updatedUser = await updateUserProfile(user.id, updates);
      const mergedUser = { ...user, ...updatedUser };
      setUser(mergedUser);
      setStoredUser(mergedUser);
    },
    [user],
  );

  /**
   * handleUploadAvatar
   *
   * Uploads a new avatar image and updates user data.
   * Returns the uploaded avatar URL.
   */
  const handleUploadAvatar = useCallback(
    async (file: File) => {
      if (!user?.id) throw new Error("Unable to upload avatar without a user ID.");
      const updatedUser = await uploadUserAvatar(user.id, file);
      setUser(updatedUser);
      setStoredUser(updatedUser);
      return updatedUser.avatar_url ?? "";
    },
    [user],
  );

  return {
    hasToken,
    user,
    loading,
    error,
    ...portfolio,
    handleLogout,
    handleSaveProfile,
    handleUploadAvatar,
  };
}

/**
 * useUserProfileData
 *
 * Fetches and displays another user's public profile and portfolio.
 * Ideal for viewing user pages or collaborator profiles.
 *
 * Responsibilities:
 * - Retrieve user data via ID.
 * - Fetch public-facing portfolio (projects, collaborations, sessions).
 * - Handle loading and error states for missing/deleted users.
 */
export function useUserProfileData(
  userId?: number | null,
): UsePublicProfileDataResult {
  const isValidId = Number.isFinite(userId) && (userId ?? 0) > 0;
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect: Load the target user's public profile.
   */
  useEffect(() => {
    if (!isValidId || !userId) {
      setUser(null);
      setError("We couldn't find that profile.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadUser = async () => {
      try {
        const profile = await fetchUserById(userId);
        if (cancelled) return;
        if (!profile) {
          setError("This user doesn't exist or was removed.");
          setUser(null);
          return;
        }
        setUser(profile);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unable to load profile.";
        setError(message);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadUser();
    return () => {
      cancelled = true;
    };
  }, [isValidId, userId]);

  // Fetch public portfolio data for this user
  const portfolio = useProfilePortfolio({
    userId: user?.id ?? null,
    enabled: Boolean(user?.id),
    errorMessage: "Unable to load this user's work right now.",
  });

  return {
    user,
    loading,
    error,
    ...portfolio,
  };
}

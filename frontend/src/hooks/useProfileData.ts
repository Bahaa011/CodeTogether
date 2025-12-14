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
import { type Project } from "../graphql/project.api";
import { type UserCollaboration } from "../graphql/collaborator.api";
import {
  AUTH_TOKEN_EVENT,
  getToken,
  removeToken,
  setRole,
  type StoredUser,
} from "../utils/auth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearPortfolioForUser,
  fetchUserPortfolio,
  type ProfileStats as PortfolioStats,
} from "../store/portfolioSlice";
export type { ProfileStats } from "../store/portfolioSlice";
import {
  clearCurrentUser,
  fetchUserById as fetchUserByIdThunk,
  refreshCurrentUser,
  saveUserProfile,
  uploadAvatar,
  type UserRecord,
} from "../store/userSlice";

type PublicUserProfile = UserRecord;

/**
 * ProfilePortfolioState
 *
 * Captures the full data state of a user's portfolio,
 * including loading/error flags and project/collaboration lists.
 */
type ProfilePortfolioState = {
  stats: PortfolioStats;
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
export type UseProfileDataResult = {
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
  const dispatch = useAppDispatch();
  const portfolioRecord = useAppSelector((state) =>
    userId ? state.portfolio.byUserId[userId] : undefined,
  );

  useEffect(() => {
    if (!enabled) {
      if (userId) {
        dispatch(clearPortfolioForUser(userId));
      }
      return;
    }

    if (!userId) return;

    const status = portfolioRecord?.statsStatus ?? "idle";
    if (status === "idle" || status === "failed") {
      void dispatch(fetchUserPortfolio({ userId, errorMessage }));
    }
  }, [dispatch, enabled, errorMessage, userId, portfolioRecord?.statsStatus]);

  const fallbackStats: PortfolioStats = {
    projects: 0,
    collaborations: 0,
    sessions: 0,
  };

  const stats = portfolioRecord?.stats ?? fallbackStats;
  const projects = portfolioRecord?.projects ?? [];
  const collaborations = portfolioRecord?.collaborations ?? [];

  const statsLoading = portfolioRecord?.statsStatus === "loading";
  const projectsLoading = portfolioRecord?.projectsStatus === "loading";
  const collaborationsLoading =
    portfolioRecord?.collaborationsStatus === "loading";

  const statsError = enabled ? portfolioRecord?.statsError ?? null : null;
  const projectsError = enabled ? portfolioRecord?.projectsError ?? null : null;
  const collaborationsError = enabled
    ? portfolioRecord?.collaborationsError ?? null
    : null;

  return {
    stats: enabled ? stats : fallbackStats,
    statsLoading: enabled ? statsLoading : false,
    statsError: enabled ? statsError : null,
    projects: enabled ? projects : [],
    projectsLoading: enabled ? projectsLoading : false,
    projectsError: enabled ? projectsError : null,
    collaborations: enabled ? collaborations : [],
    collaborationsLoading: enabled ? collaborationsLoading : false,
    collaborationsError: enabled ? collaborationsError : null,
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
  const dispatch = useAppDispatch();
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));
  const currentUserId = useAppSelector((state) => state.users.currentUserId);
  const currentUser = useAppSelector((state) =>
    currentUserId ? state.users.byId[currentUserId] ?? null : null,
  );
  const currentUserStatus = useAppSelector(
    (state) => state.users.currentUserStatus,
  );
  const currentUserError = useAppSelector(
    (state) => state.users.currentUserError,
  );
  const loading =
    hasToken &&
    (currentUserStatus === "loading" ||
      (currentUserStatus === "idle" && !currentUser));
  const error = hasToken ? currentUserError : null;
  const user = (currentUser as StoredUser | null) ?? null;

  /**
   * Effect: Keep token state synchronized across tabs and events.
   */
  useEffect(() => {
    const syncTokenState = () => {
      const tokenPresent = Boolean(getToken());
      setHasToken(tokenPresent);
      if (!tokenPresent) {
        setRole(null);
        dispatch(clearCurrentUser());
      }
    };

    window.addEventListener(AUTH_TOKEN_EVENT, syncTokenState);
    window.addEventListener("storage", syncTokenState);
    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT, syncTokenState);
      window.removeEventListener("storage", syncTokenState);
    };
  }, [dispatch]);

  /**
   * Effect: Fetch authenticated user's profile from API.
   * Falls back to local storage cache if available.
   */
  useEffect(() => {
    if (!hasToken) {
      dispatch(clearCurrentUser());
      return;
    }
    if (currentUserStatus === "idle") {
      void dispatch(refreshCurrentUser());
    }
  }, [currentUserStatus, dispatch, hasToken]);

  useEffect(() => {
    if (currentUserStatus !== "failed" || !hasToken) return;
    removeToken();
    setRole(null);
    dispatch(clearCurrentUser());
    setHasToken(false);
  }, [currentUserStatus, dispatch, hasToken]);

  // Fetch portfolio statistics for authenticated user
  const portfolio = useProfilePortfolio({
    userId: user?.id ?? null,
    enabled: hasToken && Boolean(user?.id),
  });

  /** Logs out the user and clears local authentication state. */
  const handleLogout = useCallback(() => {
    removeToken();
    setRole(null);
    dispatch(clearCurrentUser());
    setHasToken(false);
  }, [dispatch]);

  /**
   * handleSaveProfile
   *
   * Updates the authenticated user's bio or avatar URL.
   */
  const handleSaveProfile = useCallback(
    async (updates: { bio?: string; avatar_url?: string | null }) => {
      if (!user?.id) throw new Error("Unable to update profile without a user ID.");
      await dispatch(saveUserProfile({ userId: user.id, updates })).unwrap();
    },
    [dispatch, user?.id],
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
      const updatedUser = await dispatch(
        uploadAvatar({ userId: user.id, file }),
      ).unwrap();
      return updatedUser.avatar_url ?? "";
    },
    [dispatch, user?.id],
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
  const dispatch = useAppDispatch();
  const isValidId = Number.isFinite(userId) && (userId ?? 0) > 0;
  const user = useAppSelector((state) =>
    userId ? state.users.byId[userId] ?? null : null,
  );
  const status = useAppSelector((state) =>
    userId ? state.users.profileStatus[userId] ?? "idle" : "idle",
  );
  const profileError = useAppSelector((state) =>
    userId ? state.users.profileError[userId] ?? null : null,
  );

  useEffect(() => {
    if (!isValidId || !userId) return;
    if (status === "idle" || (!user && status !== "loading")) {
      void dispatch(fetchUserByIdThunk(userId));
    }
  }, [dispatch, isValidId, status, user, userId]);

  // Fetch public portfolio data for this user
  const portfolio = useProfilePortfolio({
    userId: user?.id ?? null,
    enabled: Boolean(user?.id),
    errorMessage: "Unable to load this user's work right now.",
  });

  return {
    user: isValidId ? user : null,
    loading: isValidId ? status === "loading" : false,
    error: isValidId ? profileError : "We couldn't find that profile.",
    ...portfolio,
  };
}

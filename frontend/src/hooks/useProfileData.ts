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

export type ProfileStats = {
  projects: number;
  collaborations: number;
  sessions: number;
};

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

type UseProfilePortfolioOptions = {
  userId: number | null;
  enabled: boolean;
  errorMessage?: string;
};

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

type UsePublicProfileDataResult = {
  user: PublicUserProfile | null;
  loading: boolean;
  error: string | null;
} & ProfilePortfolioState;

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

  useEffect(() => {
    if (!enabled || !userId) {
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
    setStatsError(null);

    setProjectsLoading(true);
    setProjectsError(null);

    setCollaborationsLoading(true);
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

export function useProfileData(): UseProfileDataResult {
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(() => hasToken && !user);
  const [error, setError] = useState<string | null>(null);

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
      setUser(null);
      setLoading(false);
      setError(null);
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

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  const portfolio = useProfilePortfolio({
    userId: user?.id ?? null,
    enabled: hasToken && Boolean(user?.id),
  });

  const handleLogout = useCallback(() => {
    removeToken();
    setStoredUser(null);
    setRole(null);
    setUser(null);
    setHasToken(false);
  }, []);

  const handleSaveProfile = useCallback(
    async (updates: { bio?: string; avatar_url?: string | null }) => {
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

export function useUserProfileData(
  userId?: number | null,
): UsePublicProfileDataResult {
  const isValidId = Number.isFinite(userId) && (userId ?? 0) > 0;
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [isValidId, userId]);

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

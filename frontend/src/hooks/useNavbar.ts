import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProfile } from "../services/authService";
import {
  fetchNotificationsForUser,
  markNotificationRead,
  type Notification,
} from "../services/notificationService";
import { respondToCollaboratorInvite } from "../services/collaboratorService";
import { fetchProjects } from "../services/projectService";
import { fetchUsers, type UserSummary } from "../services/userService";
import {
  AUTH_TOKEN_EVENT,
  AUTH_USER_EVENT,
  getStoredUser,
  getToken,
  removeToken,
  setRole,
  setStoredUser,
  type StoredUser,
} from "../utils/auth";

export type SearchResult = {
  id: number;
  title: string;
  subtitle: string;
  type: "project" | "user";
  email?: string;
  avatarUrl?: string | null;
};

export function useNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getToken()));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );
  const [notificationActionMessage, setNotificationActionMessage] = useState<
    string | null
  >(null);
  const [processingInvites, setProcessingInvites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"projects" | "users">(
    "projects",
  );
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const projectCacheRef = useRef<Awaited<ReturnType<typeof fetchProjects>> | null>(null);
  const userCacheRef = useRef<UserSummary[] | null>(null);

  const resetAuthState = useCallback(() => {
    removeToken();
    setStoredUser(null);
    setRole(null);
    setUser(null);
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    setIsNotificationOpen(false);
    setNotifications([]);
    setNotificationsError(null);
    setNotificationActionMessage(null);
    setProcessingInvites([]);
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      const tokenPresent = Boolean(getToken());
      setIsLoggedIn(tokenPresent);
      if (tokenPresent) {
        setUser(getStoredUser());
      } else {
        setUser(null);
      }
    };

    const syncUser = () => {
      setUser(getStoredUser());
    };

    window.addEventListener(AUTH_TOKEN_EVENT, syncAuthState);
    window.addEventListener(AUTH_USER_EVENT, syncUser);
    window.addEventListener("storage", syncAuthState);

    syncAuthState();

    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT, syncAuthState);
      window.removeEventListener(AUTH_USER_EVENT, syncUser);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await fetchProfile();
        if (cancelled) return;
        setStoredUser(profile);
        setUser(profile);
      } catch {
        if (cancelled) return;
        resetAuthState();
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, resetAuthState]);

  const handleLogout = useCallback(() => {
    resetAuthState();
    navigate("/login");
  }, [navigate, resetAuthState]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNotificationOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError(null);
    setNotificationActionMessage(null);
    setProcessingInvites([]);

    try {
      const data = await fetchNotificationsForUser(user.id);
      setNotifications(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load notifications.";
      setNotificationsError(message);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  const trimmedSearch = searchQuery.trim();

  useEffect(() => {
    setSearchResults([]);
  }, [searchType]);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  }, [location.pathname]);

  const handleToggleNotifications = useCallback(() => {
    setIsNotificationOpen((open) => {
      const next = !open;
      if (next) {
        void loadNotifications();
      } else {
        setNotificationActionMessage(null);
        setProcessingInvites([]);
      }
      return next;
    });
  }, [loadNotifications]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      void loadNotifications();
    } else {
      setNotifications([]);
      setNotificationsError(null);
      setNotificationsLoading(false);
    }
  }, [isLoggedIn, user?.id, loadNotifications]);

  useEffect(() => {
    if (!isSearchOpen || trimmedSearch.length < 2) {
      if (trimmedSearch.length === 0) {
        setSearchError(null);
      }
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const executeSearch = async () => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        if (searchType === "projects") {
          if (!projectCacheRef.current) {
            projectCacheRef.current = await fetchProjects();
          }

          const source = projectCacheRef.current ?? [];
          const matches = source
            .filter((project) => {
              const title = project.title?.toLowerCase() ?? "";
              const description = project.description?.toLowerCase() ?? "";
              const term = trimmedSearch.toLowerCase();
              return title.includes(term) || description.includes(term);
            })
            .slice(0, 6)
            .map((project) => ({
              id: project.id,
              title: project.title ?? `Project #${project.id}`,
              subtitle:
                project.description?.slice(0, 72) ??
                "No description provided",
              type: "project" as const,
            }));

          if (!cancelled) {
            setSearchResults(matches);
          }
        } else {
          if (!userCacheRef.current) {
            userCacheRef.current = await fetchUsers();
          }

          const source = userCacheRef.current ?? [];
          const matches = source
            .filter((candidate) => {
              const username = candidate.username?.toLowerCase() ?? "";
              const email = candidate.email?.toLowerCase() ?? "";
              const term = trimmedSearch.toLowerCase();
              return username.includes(term) || email.includes(term);
            })
            .slice(0, 6)
            .map((candidate) => ({
              id: candidate.id,
              title:
                candidate.username ??
                candidate.email ??
                `User #${candidate.id}`,
              subtitle: candidate.email ?? "No email provided",
              type: "user" as const,
              email: candidate.email ?? undefined,
              avatarUrl: candidate.avatar_url ?? null,
            }));

          if (!cancelled) {
            setSearchResults(matches);
          }
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to search right now.";
        setSearchError(message);
        setSearchResults([]);
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    };

    void executeSearch();

    return () => {
      cancelled = true;
    };
  }, [isSearchOpen, searchType, trimmedSearch]);

  const formatTimestamp = useCallback((timestamp?: string) => {
    if (!timestamp) {
      return "";
    }
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(timestamp));
    } catch {
      return timestamp;
    }
  }, []);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (
        notification.type === "collaboration_invite" &&
        (!notification.metadata ||
          notification.metadata.status === undefined ||
          notification.metadata.status === null ||
          notification.metadata.status === "pending")
      ) {
        return;
      }

      setNotificationActionMessage(null);

      if (!notification.is_read) {
        try {
          await markNotificationRead(notification.id, true);
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : item,
            ),
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to update notification.";
          setNotificationsError(message);
        }
      }
      setIsNotificationOpen(false);
    },
    [],
  );

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);

      if (result.type === "project") {
        navigate(`/projects/${result.id}`);
      } else if (result.type === "user") {
        navigate(`/profile/${result.id}`);
      }
    },
    [navigate],
  );

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (searchResults[0]) {
          handleSearchSelect(searchResults[0]);
        }
      }
    },
    [handleSearchSelect, searchResults],
  );

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setSearchLoading(false);
  }, []);

  const handleInviteResponse = useCallback(
    async (notification: Notification, accept: boolean) => {
      if (!user?.id) {
        setNotificationsError(
          "You need to be logged in to respond to invitations.",
        );
        return;
      }

      setNotificationActionMessage(null);
      setNotificationsError(null);

      setProcessingInvites((prev) =>
        prev.includes(notification.id) ? prev : [...prev, notification.id],
      );

      try {
        const result = await respondToCollaboratorInvite(notification.id, {
          userId: user.id,
          accept,
        });
        const respondedAt = new Date().toISOString();
        const status: "accepted" | "declined" = accept ? "accepted" : "declined";

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: true,
                  read_at: respondedAt,
                  metadata: {
                    ...(item.metadata ?? {}),
                    status,
                    respondedAt,
                  },
                }
              : item,
          ),
        );

        setNotificationActionMessage(result.message);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to respond to invitation.";
        setNotificationsError(message);
      } finally {
        setProcessingInvites((prev) =>
          prev.filter((id) => id !== notification.id),
        );
      }
    },
    [user?.id],
  );

  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((notification) => !notification.is_read);
    if (unread.length === 0) {
      setIsNotificationOpen(false);
      return;
    }
    setNotificationActionMessage(null);
    try {
      await Promise.all(
        unread.map((notification) =>
          markNotificationRead(notification.id, true),
        ),
      );
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.is_read
            ? notification
            : { ...notification, is_read: true, read_at: nowIso },
        ),
      );
      setIsNotificationOpen(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to update notifications right now.";
      setNotificationsError(message);
    }
  }, [notifications]);

  const closeMenus = useCallback(() => {
    setIsMenuOpen(false);
    setIsNotificationOpen(false);
  }, []);

  return {
    locationPath: location.pathname,
    user,
    isLoggedIn,
    isMenuOpen,
    isNotificationOpen,
    notifications,
    notificationsLoading,
    notificationsError,
    notificationActionMessage,
    processingInvites,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    searchLoading,
    searchError,
    isSearchOpen,
    setIsSearchOpen,
    unreadCount,
    avatarRef,
    notificationRef,
    searchContainerRef,
    handleLogout,
    toggleMenu: () => setIsMenuOpen((open) => !open),
    closeMenu: () => setIsMenuOpen(false),
    handleToggleNotifications,
    handleNotificationClick,
    handleInviteResponse,
    handleMarkAllRead,
    handleSearchSelect,
    handleSearchKeyDown,
    handleSearchClear,
    formatTimestamp,
    closeMenus,
  };
}

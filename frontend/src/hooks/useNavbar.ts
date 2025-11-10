/**
 * useNavbar Hook
 *
 * Manages all authentication, search, and notification logic for the
 * application’s top navigation bar.
 *
 * Responsibilities:
 * - Handle authentication state, syncing with localStorage and global events.
 * - Fetch and update user profile information.
 * - Manage dropdown menus (profile, notifications, search).
 * - Fetch, mark, and respond to notifications (including collaborator invites).
 * - Handle search functionality for both users and projects with caching.
 * - Provide reactive state and event handlers for UI interactivity.
 */

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

/**
 * SearchResult
 *
 * Defines the unified search result model for both projects and users.
 *
 * Fields:
 * - id: Unique identifier for the result (project or user).
 * - title: Display title (e.g., project title or username).
 * - subtitle: Supplementary text (e.g., project description or user email).
 * - type: Indicates whether the result represents a "project" or "user".
 * - email: Optional user email (for user results only).
 * - avatarUrl: Optional avatar URL (for user results only).
 */
export type SearchResult = {
  id: number;
  title: string;
  subtitle: string;
  type: "project" | "user";
  email?: string;
  avatarUrl?: string | null;
};

/**
 * useNavbar
 *
 * Core hook for managing navigation bar behavior and data flow.
 *
 * Returns:
 * - user: The currently authenticated user (or null if none).
 * - isLoggedIn: Whether a valid token and user session exist.
 * - notifications: List of notifications for the logged-in user.
 * - unreadCount: Computed count of unread notifications.
 * - searchQuery / searchType / searchResults: State and handlers for search UI.
 * - isMenuOpen / isNotificationOpen / isSearchOpen: Menu visibility states.
 * - loading and error states for notifications and search.
 * - Handlers for logout, search selection, notification clicks, etc.
 * - Ref objects for detecting clicks outside dropdowns.
 */
export function useNavbar() {
  // --- Navigation and location ---
  const navigate = useNavigate();
  const location = useLocation();

  // --- Authentication state ---
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getToken()));

  // --- Menu and dropdown state ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- Notification state ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );
  const [notificationActionMessage, setNotificationActionMessage] = useState<
    string | null
  >(null);
  const [processingInvites, setProcessingInvites] = useState<number[]>([]);

  // --- Search state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"projects" | "users">(
    "projects",
  );
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- Refs for click-outside detection ---
  const avatarRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // --- Cached data for search ---
  const projectCacheRef =
    useRef<Awaited<ReturnType<typeof fetchProjects>> | null>(null);
  const userCacheRef = useRef<UserSummary[] | null>(null);

  /**
   * resetAuthState
   *
   * Clears all authentication-related state and stored tokens.
   * Used when logging out or when the session becomes invalid.
   */
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

  /**
   * Effect: Sync authentication state across browser tabs and events.
   * Responds to `AUTH_TOKEN_EVENT`, `AUTH_USER_EVENT`, and `storage` events.
   */
  useEffect(() => {
    const syncAuthState = () => {
      const tokenPresent = Boolean(getToken());
      setIsLoggedIn(tokenPresent);
      setUser(tokenPresent ? getStoredUser() : null);
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

  /**
   * Effect: Load user profile after successful login.
   */
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await fetchProfile();
        if (!cancelled) {
          setStoredUser(profile);
          setUser(profile);
        }
      } catch {
        if (!cancelled) resetAuthState();
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, resetAuthState]);

  /** Logs out and redirects to the login page. */
  const handleLogout = useCallback(() => {
    resetAuthState();
    navigate("/login");
  }, [navigate, resetAuthState]);

  /** Closes menu whenever the route changes. */
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  /**
   * Detects and closes profile menu when clicking outside its area.
   */
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  /**
   * Detects and closes notifications dropdown when clicking outside its area.
   */
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationOpen]);

  /**
   * Detects and closes search container when clicking outside.
   */
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  /**
   * loadNotifications
   *
   * Fetches notifications for the logged-in user
   * and updates state accordingly.
   */
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

  /** Derived count of unread notifications. */
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  /** Search logic and cache management. */
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

  /**
   * Toggles the notification panel and loads notifications if opened.
   */
  const handleToggleNotifications = useCallback(() => {
    setIsNotificationOpen((open) => {
      const next = !open;
      if (next) void loadNotifications();
      else {
        setNotificationActionMessage(null);
        setProcessingInvites([]);
      }
      return next;
    });
  }, [loadNotifications]);

  /**
   * Effect: Automatically load notifications when user logs in.
   */
  useEffect(() => {
    if (isLoggedIn && user?.id) void loadNotifications();
    else {
      setNotifications([]);
      setNotificationsError(null);
      setNotificationsLoading(false);
    }
  }, [isLoggedIn, user?.id, loadNotifications]);

  /**
   * Effect: Execute search when search panel is open
   * and query length is at least 2 characters.
   */
  useEffect(() => {
    if (!isSearchOpen || trimmedSearch.length < 2) {
      if (trimmedSearch.length === 0) setSearchError(null);
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
          if (!projectCacheRef.current)
            projectCacheRef.current = await fetchProjects();

          const source = projectCacheRef.current ?? [];
          const matches = source
            .filter((p) => {
              const term = trimmedSearch.toLowerCase();
              return (
                p.title?.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
              );
            })
            .slice(0, 6)
            .map((p) => ({
              id: p.id,
              title: p.title ?? `Project #${p.id}`,
              subtitle: p.description?.slice(0, 72) ?? "No description provided",
              type: "project" as const,
            }));
          if (!cancelled) setSearchResults(matches);
        } else {
          if (!userCacheRef.current)
            userCacheRef.current = await fetchUsers();

          const source = userCacheRef.current ?? [];
          const matches = source
            .filter((u) => {
              const term = trimmedSearch.toLowerCase();
              return (
                u.username?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term)
              );
            })
            .slice(0, 6)
            .map((u) => ({
              id: u.id,
              title: u.username ?? u.email ?? `User #${u.id}`,
              subtitle: u.email ?? "No email provided",
              type: "user" as const,
              email: u.email ?? undefined,
              avatarUrl: u.avatar_url ?? null,
            }));
          if (!cancelled) setSearchResults(matches);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to search right now.";
          setSearchError(message);
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };

    void executeSearch();
    return () => {
      cancelled = true;
    };
  }, [isSearchOpen, searchType, trimmedSearch]);

  /** Utility for formatting timestamps in notifications. */
  const formatTimestamp = useCallback((timestamp?: string) => {
    if (!timestamp) return "";
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(timestamp));
    } catch {
      return timestamp;
    }
  }, []);

  /**
   * Marks a single notification as read when clicked
   * and handles navigation logic if applicable.
   */
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
                ? { ...item, is_read: true, read_at: new Date().toISOString() }
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

  /**
   * Handles selection of a search result and navigates accordingly.
   */
  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);

      if (result.type === "project") navigate(`/projects/${result.id}`);
      else if (result.type === "user") navigate(`/profile/${result.id}`);
    },
    [navigate],
  );

  /** Allows Enter key to trigger the first search result selection. */
  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (searchResults[0]) handleSearchSelect(searchResults[0]);
      }
    },
    [handleSearchSelect, searchResults],
  );

  /** Clears search query and resets results/errors. */
  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setSearchLoading(false);
  }, []);

  /**
   * Handles responding to a collaborator invite
   * (accepting or declining from notifications list).
   */
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
        const status: "accepted" | "declined" = accept
          ? "accepted"
          : "declined";

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

  /**
   * Marks all notifications as read and updates state.
   */
  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) {
      setIsNotificationOpen(false);
      return;
    }
    setNotificationActionMessage(null);
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id, true)));
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: nowIso })),
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

  /** Closes both dropdown menus simultaneously. */
  const closeMenus = useCallback(() => {
    setIsMenuOpen(false);
    setIsNotificationOpen(false);
  }, []);

  // --- Return API for Navbar ---
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

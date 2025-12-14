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
import { type Notification } from "../graphql/notification.api";
import {
  AUTH_TOKEN_EVENT,
  getToken,
  removeToken,
  setRole,
  setStoredUser,
} from "../utils/auth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearCurrentUser,
  fetchUsers as loadUsers,
  refreshCurrentUser,
} from "../store/userSlice";
import {
  clearNotifications,
  loadNotificationsForUser,
  updateNotificationStatus,
} from "../store/notificationsSlice";
import { loadPublicProjects } from "../store/projectsSlice";
import { respondToCollaboratorInviteThunk } from "../store/collaboratorsSlice";

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
  const dispatch = useAppDispatch();

  // --- Global user directory state (GraphQL via Redux) ---
  const {
    list: cachedUsers,
    listStatus: usersStatus,
    listError: usersError,
  } = useAppSelector((state) => state.users);
  const currentUserId = useAppSelector((state) => state.users.currentUserId);
  const user = useAppSelector((state) =>
    currentUserId ? state.users.byId[currentUserId] ?? null : null,
  );
  const currentUserStatus = useAppSelector(
    (state) => state.users.currentUserStatus,
  );

  // --- Notification state ---
  const [notificationsUiError, setNotificationsUiError] = useState<string | null>(
    null,
  );
  const [notificationActionMessage, setNotificationActionMessage] = useState<
    string | null
  >(null);
  const [processingInvites, setProcessingInvites] = useState<number[]>([]);

  const notifications = useAppSelector((state) => state.notifications.list);
  const notificationsStatus = useAppSelector((state) => state.notifications.status);
  const notificationsStateError = useAppSelector(
    (state) => state.notifications.error,
  );
  const notificationsLoading = notificationsStatus === "loading";
  const notificationsError = notificationsUiError ?? notificationsStateError;

  const publicProjects = useAppSelector((state) => state.projects.list);
  const projectsStatus = useAppSelector((state) => state.projects.status);
  const projectsError = useAppSelector((state) => state.projects.error);

  // --- Authentication state ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getToken()));

  // --- Menu and dropdown state ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    dispatch(clearCurrentUser());
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    setIsNotificationOpen(false);
    dispatch(clearNotifications());
    setNotificationsUiError(null);
    setNotificationActionMessage(null);
    setProcessingInvites([]);
  }, [dispatch]);

  /**
   * Effect: Sync authentication state across browser tabs and events.
   * Responds to `AUTH_TOKEN_EVENT`, `AUTH_USER_EVENT`, and `storage` events.
   */
  useEffect(() => {
    const syncAuthState = () => {
      const tokenPresent = Boolean(getToken());
      setIsLoggedIn(tokenPresent);
    };

    window.addEventListener(AUTH_TOKEN_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    syncAuthState();

    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  /**
   * Effect: Load user profile after successful login.
   */
  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(clearCurrentUser());
      return;
    }
    if (currentUserStatus === "idle") {
      void dispatch(refreshCurrentUser());
    }
  }, [currentUserStatus, dispatch, isLoggedIn]);

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
      dispatch(clearNotifications());
      return;
    }

    setNotificationsUiError(null);
    setNotificationActionMessage(null);
    setProcessingInvites([]);

    try {
      await dispatch(loadNotificationsForUser(user.id)).unwrap();
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to load notifications.";
      setNotificationsUiError(message);
    }
  }, [dispatch, user?.id]);

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
      dispatch(clearNotifications());
      setNotificationsUiError(null);
    }
  }, [dispatch, isLoggedIn, user?.id, loadNotifications]);

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

    setSearchLoading(true);
    setSearchError(null);

    if (searchType === "users") {
      if (usersStatus === "idle") {
        void dispatch(loadUsers());
      }

      if (usersStatus === "failed") {
        setSearchResults([]);
        setSearchLoading(false);
        setSearchError(usersError ?? "Unable to search right now.");
        return;
      }

      if (
        (usersStatus === "loading" || usersStatus === "idle") &&
        cachedUsers.length === 0
      ) {
        return;
      }

      const term = trimmedSearch.toLowerCase();
      const matches = cachedUsers
        .filter((u) => {
          const username = u.username?.toLowerCase() ?? "";
          const email = u.email?.toLowerCase() ?? "";
          return username.includes(term) || email.includes(term);
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

      setSearchResults(matches);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const runProjectSearch = () => {
      if (projectsStatus === "idle") {
        void dispatch(loadPublicProjects());
        return;
      }

      if (projectsStatus === "failed") {
        setSearchResults([]);
        setSearchLoading(false);
        setSearchError(projectsError ?? "Unable to search right now.");
        return;
      }

      if (projectsStatus === "loading" && publicProjects.length === 0) {
        return;
      }

      const term = trimmedSearch.toLowerCase();
      const matches = publicProjects
        .filter((p) => {
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

      if (!cancelled) {
        setSearchResults(matches);
        setSearchLoading(false);
      }
    };

    runProjectSearch();
    return () => {
      cancelled = true;
    };
  }, [
    cachedUsers,
    dispatch,
    isSearchOpen,
    searchType,
    trimmedSearch,
    usersError,
    usersStatus,
    publicProjects,
    projectsError,
    projectsStatus,
  ]);

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
          await dispatch(
            updateNotificationStatus({
              notificationId: notification.id,
              isRead: true,
            }),
          ).unwrap();
        } catch (err) {
          const message =
            typeof err === "string"
              ? err
              : err instanceof Error
                ? err.message
                : "Unable to update notification.";
          setNotificationsUiError(message);
        }
      }
      setIsNotificationOpen(false);
    },
    [dispatch],
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
        setNotificationsUiError(
          "You need to be logged in to respond to invitations.",
        );
        return;
      }

      setNotificationActionMessage(null);
      setNotificationsUiError(null);
      setProcessingInvites((prev) =>
        prev.includes(notification.id) ? prev : [...prev, notification.id],
      );

      try {
        const result = await dispatch(
          respondToCollaboratorInviteThunk({
            notificationId: notification.id,
            userId: user.id,
            accept,
          }),
        ).unwrap();
        setNotificationActionMessage(result.message);
        void loadNotifications();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to respond to invitation.";
        setNotificationsUiError(message);
      } finally {
        setProcessingInvites((prev) =>
          prev.filter((id) => id !== notification.id),
        );
      }
    },
    [dispatch, loadNotifications, user?.id],
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
      await Promise.all(
        unread.map((notification) =>
          dispatch(
            updateNotificationStatus({
              notificationId: notification.id,
              isRead: true,
            }),
          ).unwrap(),
        ),
      );
      setIsNotificationOpen(false);
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Unable to update notifications right now.";
      setNotificationsUiError(message);
    }
  }, [dispatch, notifications]);

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

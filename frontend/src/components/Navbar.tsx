import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Plus, Search, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProfile } from "../services/authService";
import {
  fetchNotificationsForUser,
  markNotificationRead,
  type Notification,
  type NotificationMetadata,
} from "../services/notificationService";
import { respondToCollaboratorInvite } from "../services/collaboratorService";
import { fetchProjects, type Project } from "../services/projectService";
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
import "../styles/navbar.css";
import { resolveAssetUrl } from "../utils/url";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Explore", path: "/explore" },
  { label: "Teams", path: "/teams" },
  { label: "About", path: "/about" },
];

function isActivePath(current: string, target: string) {
  if (target === "/") {
    return current === "/";
  }

  return current.startsWith(target);
}

type NavbarProps = {
  onCreateProject?(): void;
};

type SearchResult = {
  id: number;
  title: string;
  subtitle: string;
  type: "project" | "user";
  email?: string;
  avatarUrl?: string | null;
};

export default function Navbar(props: NavbarProps = {}) {
  const { onCreateProject } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getToken()));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationActionMessage, setNotificationActionMessage] = useState<string | null>(null);
  const [processingInvites, setProcessingInvites] = useState<number[]>([]);
  const avatarRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const projectCacheRef = useRef<Project[] | null>(null);
  const userCacheRef = useRef<UserSummary[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"projects" | "users">("projects");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const resetAuthState = () => {
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
  };

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

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    resetAuthState();
    navigate("/login");
  };

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
            const projects = await fetchProjects();
            projectCacheRef.current = projects;
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
            const users = await fetchUsers();
            userCacheRef.current = users;
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

  const formatTimestamp = (timestamp?: string) => {
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
  };

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
    [setIsNotificationOpen, setNotificationActionMessage, setNotifications, setNotificationsError],
  );

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);

      if (result.type === "project") {
        navigate(`/projects/${result.id}`);
      } else if (result.email) {
        window.open(`mailto:${result.email}`, "_blank", "noopener,noreferrer");
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
        setNotificationsError("You need to be logged in to respond to invitations.");
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
    [
      setNotificationActionMessage,
      setNotifications,
      setNotificationsError,
      setProcessingInvites,
      user?.id,
    ],
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
        : "Unable to update notifications.";
      setNotificationsError(message);
    }
  }, [notifications, setNotificationActionMessage]);

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
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  }, [location.pathname]);

  const avatarImage = resolveAssetUrl(user?.avatar_url);

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__brand">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="navbar__brand-button"
          >
            <span className="navbar__icon">CT</span>
            <span className="navbar__title">CodeTogether</span>
          </button>

          {navLinks.length > 0 && (
            <ul className="navbar__links">
              {navLinks.map(({ label, path }) => {
                const active = isActivePath(location.pathname, path);
                const className = active
                  ? "navbar__link navbar__link--active"
                  : "navbar__link";

                return (
                  <li key={path}>
                    <button
                      type="button"
                      onClick={() => navigate(path)}
                      className={className}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="navbar__search-wrapper" ref={searchContainerRef}>
          <div className="navbar__search">
            <span className="navbar__search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={
                searchType === "projects"
                  ? "Search projects..."
                  : "Search users..."
              }
              className="navbar__search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQuery && (
              <button
                type="button"
                className="navbar__search-clear"
                onClick={handleSearchClear}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {isSearchOpen && (
            <div className="navbar__search-panel">
              <div className="navbar__search-switch">
                <button
                  type="button"
                  className={
                    searchType === "projects"
                      ? "navbar__search-switch-button navbar__search-switch-button--active"
                      : "navbar__search-switch-button"
                  }
                  onClick={() => setSearchType("projects")}
                >
                  Projects
                </button>
                <button
                  type="button"
                  className={
                    searchType === "users"
                      ? "navbar__search-switch-button navbar__search-switch-button--active"
                      : "navbar__search-switch-button"
                  }
                  onClick={() => setSearchType("users")}
                >
                  Users
                </button>
              </div>

              <div className="navbar__search-results">
                {searchLoading ? (
                  <p className="navbar__search-status">Searching…</p>
                ) : trimmedSearch.length > 0 && trimmedSearch.length < 2 ? (
                  <p className="navbar__search-status">
                    Enter at least two characters to search {searchType}.
                  </p>
                ) : searchError ? (
                  <p className="navbar__search-status navbar__search-status--error">
                    {searchError}
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="navbar__search-status">
                    {trimmedSearch.length === 0
                      ? `Start typing to search ${searchType}.`
                      : "No results found."}
                  </p>
                ) : (
                  <ul className="navbar__search-list">
                    {searchResults.map((result) => (
                      <li key={`${result.type}-${result.id}`}>
                        <button
                          type="button"
                          className="navbar__search-result"
                          onClick={() => handleSearchSelect(result)}
                        >
                          <span className="navbar__search-result-title">
                            {result.title}
                          </span>
                          <span className="navbar__search-result-subtitle">
                            {result.subtitle}
                          </span>
                          <span className="navbar__search-result-pill">
                            {result.type === "project" ? "Project" : "User"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="navbar__actions">
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onCreateProject) {
                    onCreateProject();
                  } else {
                    navigate("/projects/new");
                  }
                }}
                className="navbar__primary"
              >
                <Plus size={16} />
                New Project
              </button>

              <div className="navbar__notify-wrapper" ref={notificationRef}>
                <button
                  type="button"
                  className="navbar__notify"
                  aria-label="Notifications"
                  aria-haspopup="true"
                  aria-expanded={isNotificationOpen}
                  onClick={handleToggleNotifications}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="navbar__dot" />}
                </button>

                {isNotificationOpen && (
                  <div className="navbar__notifications" role="menu">
                    <div className="navbar__notifications-header">
                      <span className="navbar__notifications-title">
                        Notifications
                      </span>
                      <button
                        type="button"
                        className="navbar__notifications-action"
                        onClick={handleMarkAllRead}
                        disabled={notificationsLoading || unreadCount === 0}
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="navbar__notifications-body">
                      {notificationActionMessage && (
                        <p className="navbar__notifications-status navbar__notifications-status--success">
                          {notificationActionMessage}
                        </p>
                      )}
                      {notificationsLoading ? (
                        <p className="navbar__notifications-status">
                          Loading notifications…
                        </p>
                      ) : notificationsError ? (
                        <p className="navbar__notifications-status navbar__notifications-status--error">
                          {notificationsError}
                        </p>
                      ) : notifications.length === 0 ? (
                        <p className="navbar__notifications-status">
                          You&apos;re all caught up!
                        </p>
                      ) : (
                        <ul className="navbar__notification-list">
                          {notifications.map((notification) => {
                            const baseClass = notification.is_read
                              ? "navbar__notification-item"
                              : "navbar__notification-item navbar__notification-item--unread";

                            if (notification.type === "collaboration_invite") {
                              const metadata = (notification.metadata ??
                                {}) as NotificationMetadata;
                              const status = (metadata.status ??
                                "pending") as "pending" | "accepted" | "declined";
                              const projectLabel =
                                typeof metadata.projectTitle === "string"
                                  ? metadata.projectTitle
                                  : typeof metadata.projectId === "number"
                                    ? `Project #${metadata.projectId}`
                                    : undefined;
                              const isProcessing = processingInvites.includes(
                                notification.id,
                              );

                              return (
                                <li
                                  key={notification.id}
                                  className={`${baseClass} navbar__notification-item--invite`}
                                >
                                  <div className="navbar__notification-invite">
                                    <div className="navbar__notification-invite-text">
                                      <span className="navbar__notification-message">
                                        {notification.message}
                                      </span>
                                      {projectLabel && (
                                        <span className="navbar__notification-extra">
                                          {projectLabel}
                                        </span>
                                      )}
                                      <span className="navbar__notification-time">
                                        {formatTimestamp(notification.created_at)}
                                      </span>
                                    </div>
                                    <div className="navbar__notification-actions">
                                      {status === "pending" ? (
                                        <>
                                          <button
                                            type="button"
                                            className="navbar__notification-pill navbar__notification-pill--ghost"
                                            onClick={() =>
                                              handleInviteResponse(
                                                notification,
                                                false,
                                              )
                                            }
                                            disabled={isProcessing}
                                          >
                                            {isProcessing
                                              ? "Declining…"
                                              : "Decline"}
                                          </button>
                                          <button
                                            type="button"
                                            className="navbar__notification-pill navbar__notification-pill--primary"
                                            onClick={() =>
                                              handleInviteResponse(
                                                notification,
                                                true,
                                              )
                                            }
                                            disabled={isProcessing}
                                          >
                                            {isProcessing
                                              ? "Accepting…"
                                              : "Accept"}
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <span
                                            className={`navbar__notification-badge navbar__notification-badge--${status}`}
                                          >
                                            {status === "accepted"
                                              ? "Accepted"
                                              : "Declined"}
                                          </span>
                                          {!notification.is_read && (
                                            <button
                                              type="button"
                                              className="navbar__notification-pill navbar__notification-pill--ghost"
                                              onClick={() =>
                                                handleNotificationClick(
                                                  notification,
                                                )
                                              }
                                            >
                                              Mark read
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            }

                            return (
                              <li key={notification.id} className={baseClass}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                  className="navbar__notification-button"
                                >
                                  <span className="navbar__notification-message">
                                    {notification.message}
                                  </span>
                                  <span className="navbar__notification-time">
                                    {formatTimestamp(notification.created_at)}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="navbar__avatar-wrapper" ref={avatarRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className={
                    avatarImage
                      ? "navbar__avatar navbar__avatar--image"
                      : "navbar__avatar"
                  }
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                  title="Account menu"
                >
                  {avatarImage ? (
                    <img src={avatarImage} alt={user?.username ?? "Avatar"} />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || "B"
                  )}
                </button>

                {isMenuOpen && (
                  <div className="navbar__dropdown" role="menu">
                    <button
                      type="button"
                      className="navbar__dropdown-item"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/profile");
                      }}
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      className="navbar__dropdown-item"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/settings");
                      }}
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      className="navbar__dropdown-item navbar__dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="navbar__login"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="navbar__signup"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

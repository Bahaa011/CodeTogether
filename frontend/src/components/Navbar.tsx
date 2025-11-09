import { Bell, Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { NotificationMetadata } from "../services/notificationService";
import "../styles/navbar.css";
import { resolveAssetUrl } from "../utils/url";
import { useNavbar } from "../hooks/useNavbar";

const navLinks = [
  { label: "Explore", path: "/explore" },
  { label: "Profile", path: "/profile"},
  { label: "Playground", path: "/playground" },
  { label: "About", path: "/about" },
];

function isActivePath(current: string, target: string) {
  if (target === "/") {
    return current === "/";
  }

  return current.startsWith(target);
}

export type NavbarProps = {
  onCreateProject?(): void;
};

export default function Navbar(props: NavbarProps = {}) {
  const { onCreateProject } = props;
  const navigate = useNavigate();
  const {
    locationPath,
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
    handleToggleNotifications,
    handleNotificationClick,
    handleInviteResponse,
    handleMarkAllRead,
    handleSearchSelect,
    handleSearchKeyDown,
    handleSearchClear,
    formatTimestamp,
    toggleMenu,
    closeMenu,
  } = useNavbar();

  const trimmedSearch = searchQuery.trim();
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
                const active = isActivePath(locationPath, path);
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
                          {result.type === "user" ? (
                            <span
                              className="navbar__search-result-avatar"
                              aria-hidden="true"
                            >
                              {result.avatarUrl ? (
                                <img
                                  src={resolveAssetUrl(result.avatarUrl)}
                                  alt={result.title}
                                  loading="lazy"
                                />
                              ) : (
                                (result.title?.[0] || "U").toUpperCase()
                              )}
                            </span>
                          ) : (
                            <span className="navbar__search-result-avatar navbar__search-result-avatar--project">
                              PR
                            </span>
                          )}
                          <span className="navbar__search-result-content">
                            <span className="navbar__search-result-title">
                              {result.title}
                            </span>
                            <span className="navbar__search-result-subtitle">
                              {result.subtitle}
                            </span>
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
                  onClick={toggleMenu}
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
                        closeMenu();
                        navigate("/profile");
                      }}
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      className="navbar__dropdown-item"
                      onClick={() => {
                        closeMenu();
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

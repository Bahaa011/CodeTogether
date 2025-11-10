/**
 * Settings Page
 * --------------
 * Provides a unified control center for user preferences, appearance,
 * account security, and workspace configurations.
 *
 * Includes:
 * - Light/Dark theme toggle
 * - Profile management (bio, avatar)
 * - MFA (multi-factor authentication) control
 * - Accessibility and layout consistency
 */

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import "../styles/settings.css";
import { useTheme } from "../hooks/useTheme";
import { useSettingsPage } from "../hooks/useSettingsPage";
import EditProfileModal from "../components/modal/EditProfileModal";

export default function Settings() {
  const {
    user,
    loading,
    error,
    feedback,
    mfaBusy,
    handleToggleMfa,
    isAuthenticated,
  } = useSettingsPage();
  const { theme, setTheme } = useTheme();

  // Modal state for editing profile
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  /**
   * handleThemeSelect
   * ------------------
   * Updates the app’s visual theme preference.
   */
  const handleThemeSelect = (value: "light" | "dark") => {
    setTheme(value);
  };

  /**
   * renderAppearanceCard
   * ---------------------
   * Renders the section for selecting between light and dark modes.
   */
  const renderAppearanceCard = () => (
    <section
      className="settings-card settings-card--appearance"
      aria-labelledby="appearance-settings-heading"
    >
      <div className="settings-card-eyebrow">Display</div>
      <div className="settings-card-heading">
        <div>
          <h2 id="appearance-settings-heading" className="settings-card-title">
            Appearance
          </h2>
          <p className="settings-card-text">
            Instantly switch between light and dark themes. Your choice stays synced per device.
          </p>
        </div>
        <span className="settings-chip">New</span>
      </div>

      <div className="appearance-toggle" role="group" aria-label="Theme options">
        <button
          type="button"
          className={
            theme === "light"
              ? "appearance-toggle__option appearance-toggle__option--active"
              : "appearance-toggle__option"
          }
          onClick={() => handleThemeSelect("light")}
          aria-pressed={theme === "light"}
        >
          <Sun size={18} />
          <span>Light</span>
        </button>
        <button
          type="button"
          className={
            theme === "dark"
              ? "appearance-toggle__option appearance-toggle__option--active"
              : "appearance-toggle__option"
          }
          onClick={() => handleThemeSelect("dark")}
          aria-pressed={theme === "dark"}
        >
          <Moon size={18} />
          <span>Dark</span>
        </button>
      </div>

      <div className="appearance-preview" data-preview-theme={theme}>
        <div className="appearance-preview__panel appearance-preview__panel--primary">
          <div className="appearance-preview__bar" />
          <div className="appearance-preview__line appearance-preview__line--long" />
          <div className="appearance-preview__line appearance-preview__line--medium" />
          <div className="appearance-preview__line appearance-preview__line--short" />
        </div>
        <div className="appearance-preview__panel appearance-preview__panel--secondary">
          <div className="appearance-preview__line appearance-preview__line--medium" />
          <div className="appearance-preview__line appearance-preview__line--short" />
        </div>
      </div>
    </section>
  );

  /**
   * renderGeneralCard
   * ------------------
   * Displays general workspace-related preferences (e.g. profile management).
   */
  const renderGeneralCard = () => (
    <section className="settings-card" aria-labelledby="general-settings-heading">
      <div className="settings-card-eyebrow">Workspace</div>
      <h2 id="general-settings-heading" className="settings-card-title">
        General
      </h2>
      <p className="settings-card-text">
        Control the essentials for projects, personal info, and how CodeTogether keeps you in the loop.
      </p>
      <ul className="settings-list">
        <li className="settings-list-item">
          <div>
            <p className="settings-item-title">Profile details</p>
            <p className="settings-item-description">
              Edit your bio, avatar, and username from the profile page.
            </p>
          </div>
          <button
            type="button"
            className="settings-action"
            onClick={() => setEditProfileOpen(true)}
          >
            Manage
          </button>
        </li>
        <li className="settings-list-item">
          <div>
            <p className="settings-item-title">Project notifications</p>
            <p className="settings-item-description">
              Choose how you want updates delivered.
            </p>
          </div>
          <button type="button" className="settings-action" disabled>
            Configure
          </button>
        </li>
      </ul>
    </section>
  );

  /**
   * renderPrivacyCard
   * ------------------
   * Displays privacy and security settings, including MFA.
   */
  const renderPrivacyCard = () => (
    <section className="settings-card" aria-labelledby="privacy-settings-heading">
      <div className="settings-card-eyebrow">Security</div>
      <h2 id="privacy-settings-heading" className="settings-card-title">
        Privacy &amp; Security
      </h2>
      <p className="settings-card-text">
        Keep your workstation safe with MFA and control who can see your footprint.
      </p>
      <ul className="settings-list">
        <li className="settings-list-item">
          <div>
            <p className="settings-item-title">Multi-factor authentication</p>
            <p className="settings-item-description">
              {loading
                ? "Checking your MFA status…"
                : user?.mfa_enabled
                  ? "Enabled — we’ll email you a 6-digit code when you sign in."
                  : "Disabled — add a second verification step for your logins."}
            </p>
          </div>
          <button
            type="button"
            className="settings-action"
            onClick={handleToggleMfa}
            disabled={mfaBusy || loading}
          >
            {user?.mfa_enabled ? "Disable" : "Enable"}
          </button>
        </li>
        <li className="settings-list-item">
          <div>
            <p className="settings-item-title">Visibility preferences</p>
            <p className="settings-item-description">
              Choose how your activity shows up across CodeTogether.
            </p>
          </div>
          <button type="button" className="settings-action" disabled>
            Adjust
          </button>
        </li>
      </ul>
    </section>
  );

  /**
   * renderContent
   * --------------
   * Handles conditional rendering based on authentication state.
   */
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="settings-grid settings-grid--adaptive">
          {renderAppearanceCard()}
          <section className="settings-card settings-card--placeholder">
            <h2 className="settings-card-title">Sign in to manage account</h2>
            <p className="settings-card-text">
              You need to be signed in to update account settings. Head to the login page to continue.
            </p>
          </section>
        </div>
      );
    }

    return (
      <div className="settings-grid settings-grid--adaptive">
        {renderAppearanceCard()}
        {renderGeneralCard()}
        {renderPrivacyCard()}
      </div>
    );
  };

  /**
   * JSX Return
   * -----------
   * Main page layout containing header, alerts, and modals.
   */
  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <p className="settings-eyebrow">Control Center</p>
          <h1 className="settings-title">Account Settings</h1>
          <p className="settings-subtitle">
            Review your general preferences, privacy controls, and appearance in one place.
          </p>
        </div>
        <div className="settings-header-card">
          <p className="settings-header-metric">Theme</p>
          <p className="settings-header-value">{theme === "dark" ? "Dark" : "Light"} mode</p>
        </div>
      </header>

      {error && (
        <p className="settings-alert settings-alert--error" role="status">
          {error}
        </p>
      )}

      {feedback && !error && (
        <p className="settings-alert settings-alert--success" role="status">
          {feedback}
        </p>
      )}

      {renderContent()}

      {editProfileOpen && (
        <EditProfileModal
          open={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          initialBio={user?.bio ?? ""}
          initialAvatarUrl={user?.avatar_url ?? null}
          onSave={async () => setEditProfileOpen(false)}
          onUploadAvatar={async (file: File) => URL.createObjectURL(file)}
        />
      )}
    </div>
  );
}

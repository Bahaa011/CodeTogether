import { useEffect, useState } from "react";
import "../styles/settings.css";
import { fetchProfile, toggleMfa } from "../services/authService";
import { getToken, getStoredUser, setStoredUser, type StoredUser } from "../utils/auth";

export default function Settings() {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(() => Boolean(getToken()) && !user);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
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
          err instanceof Error
            ? err.message
            : "Unable to load your settings right now.";
        setError(message);
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
  }, []);

  const handleToggleMfa = async () => {
    if (!user || mfaBusy) return;
    setFeedback(null);
    setError(null);
    setMfaBusy(true);

    try {
      const updated = await toggleMfa(!user.mfa_enabled);
      setUser(updated);
      setStoredUser(updated);
      setFeedback(
        updated.mfa_enabled
          ? "Multi-factor authentication is now enabled. We'll email you a 6-digit code when you sign in."
          : "Multi-factor authentication has been disabled.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update MFA right now.";
      setError(message);
    } finally {
      setMfaBusy(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <section className="settings-card">
          <p className="settings-card-text">Loading your preferences…</p>
        </section>
      );
    }

    if (!getToken()) {
      return (
        <section className="settings-card">
          <h2 className="settings-card-title">Please sign in</h2>
          <p className="settings-card-text">
            You need to be signed in to update account settings. Head to the login page to continue.
          </p>
        </section>
      );
    }

    return (
      <div className="settings-grid">
        <section className="settings-card" aria-labelledby="general-settings-heading">
          <h2 id="general-settings-heading" className="settings-card-title">
            General
          </h2>
          <p className="settings-card-text">
            Control basic account details like your profile information and notification preferences.
          </p>
          <ul className="settings-list">
            <li className="settings-list-item">
              <div>
                <p className="settings-item-title">Profile details</p>
                <p className="settings-item-description">
                  Edit your bio, avatar, and username from the profile page.
                </p>
              </div>
              <button type="button" className="settings-action" disabled>
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

        <section className="settings-card" aria-labelledby="privacy-settings-heading">
          <h2 id="privacy-settings-heading" className="settings-card-title">
            Privacy &amp; Security
          </h2>
          <p className="settings-card-text">
            Keep your account secure with multi-factor authentication and manage who can view your activity.
          </p>
          <ul className="settings-list">
            <li className="settings-list-item">
              <div>
                <p className="settings-item-title">Multi-factor authentication</p>
                <p className="settings-item-description">
                  {user?.mfa_enabled
                    ? "Enabled — we’ll email you a 6-digit code when you sign in."
                    : "Disabled — add a second verification step for your logins."}
                </p>
              </div>
              <button
                type="button"
                className="settings-action"
                onClick={handleToggleMfa}
                disabled={mfaBusy}
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
      </div>
    );
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1 className="settings-title">Account Settings</h1>
        <p className="settings-subtitle">
          Review your general preferences and privacy controls in one place.
        </p>
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
    </div>
  );
}

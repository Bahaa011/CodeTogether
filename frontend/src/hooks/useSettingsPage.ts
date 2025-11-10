/**
 * useSettingsPage Hook
 * ---------------------------------------
 * Manages the logic for the user Settings page.
 * Handles fetching the current profile, syncing local storage,
 * and toggling multi-factor authentication (MFA).
 *
 * This hook ensures user data stays up to date between the
 * backend and the stored session state.
 */

import { useCallback, useEffect, useState } from "react";
import { fetchProfile, toggleMfa } from "../services/authService";
import {
  getStoredUser,
  getToken,
  setStoredUser,
  type StoredUser,
} from "../utils/auth";

/**
 * useSettingsPage
 * ---------------------------------------
 * Loads the authenticated user's profile and manages updates
 * to account-level settings such as MFA.
 *
 * Workflow:
 * 1. On mount, it checks for a valid token and fetches the profile if available.
 * 2. Syncs the user state with localStorage using getStoredUser and setStoredUser.
 * 3. Exposes an action for toggling MFA on or off through the backend.
 *
 * Returned values:
 * - user: The current user profile or null if not available.
 * - loading: Indicates whether profile data is still loading.
 * - error: Holds the last error message, if any.
 * - feedback: Holds a success message when updates complete.
 * - mfaBusy: Indicates if an MFA operation is currently in progress.
 * - handleToggleMfa: Toggles the user's MFA setting.
 * - isAuthenticated: True if a valid token exists.
 */
export function useSettingsPage() {
  const token = getToken();
  const isAuthenticated = Boolean(token);
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(() => isAuthenticated && !user);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
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
  }, [token]);

  const handleToggleMfa = useCallback(async () => {
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
  }, [mfaBusy, user]);

  return {
    user,
    loading,
    error,
    feedback,
    mfaBusy,
    handleToggleMfa,
    isAuthenticated,
  };
}

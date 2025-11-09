import { useCallback, useEffect, useState } from "react";
import { fetchProfile, toggleMfa } from "../services/authService";
import {
  getStoredUser,
  getToken,
  setStoredUser,
  type StoredUser,
} from "../utils/auth";

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

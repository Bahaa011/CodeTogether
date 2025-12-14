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
import { getToken } from "../utils/auth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearCurrentUser,
  refreshCurrentUser,
  toggleUserMfa,
} from "../store/userSlice";

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
  const dispatch = useAppDispatch();
  const token = getToken();
  const isAuthenticated = Boolean(token);
  const currentUserId = useAppSelector((state) => state.users.currentUserId);
  const user = useAppSelector((state) =>
    currentUserId ? state.users.byId[currentUserId] ?? null : null,
  );
  const currentUserStatus = useAppSelector(
    (state) => state.users.currentUserStatus,
  );
  const storeError = useAppSelector(
    (state) => state.users.currentUserError,
  );
  const loading = isAuthenticated && currentUserStatus === "loading";
  const [error, setError] = useState<string | null>(storeError);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearCurrentUser());
      return;
    }
    if (currentUserStatus === "idle") {
      void dispatch(refreshCurrentUser());
    }
  }, [currentUserStatus, dispatch, isAuthenticated]);

  useEffect(() => {
    setError(storeError);
  }, [storeError]);

  const handleToggleMfa = useCallback(async () => {
    if (!user || mfaBusy) return;
    setFeedback(null);
    setError(null);
    setMfaBusy(true);

    try {
      const updated = await dispatch(
        toggleUserMfa({ enabled: !user.mfa_enabled }),
      ).unwrap();
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
  }, [dispatch, mfaBusy, user]);

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

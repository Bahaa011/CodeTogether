/**
 * Authentication Hooks
 * ----------------------
 * Collection of reusable hooks for managing authentication flows:
 * - `useLoginForm`: Handles login, MFA verification, and password reset.
 * - `useRegisterForm`: Handles user registration with password validation.
 * - `useResetPasswordForm`: Handles resetting a user's password via token.
 *
 * Each hook is fully self-contained, returning both UI-ready state and event handlers.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyMfaLogin,
  type LoginResponse,
  type LoginSuccessResponse,
  type MfaChallengeResponse,
} from "../services/authService";
import { getToken, setRole, setStoredUser, setToken } from "../utils/auth";

/* -------------------------------------------------------------------------- */
/*                              useLoginForm Hook                             */
/* -------------------------------------------------------------------------- */

/**
 * useLoginFormOptions
 * ---------------------
 * Configuration options for `useLoginForm`.
 * - incomingResetSuccess: Optional message shown after password reset redirect.
 * - onAuthenticated: Called once the user has logged in successfully.
 * - onResetSuccess: Called after a password reset email request is successful.
 * - replaceLocation: Function to update browser location/state.
 * - redirectState: Optional redirect state after login success.
 */
type UseLoginFormOptions = {
  incomingResetSuccess?: string | null;
  onAuthenticated(): void;
  onResetSuccess(message: string): void;
  replaceLocation(state?: Record<string, unknown>): void;
  redirectState?: Record<string, unknown>;
};

/** Type guard to detect MFA challenge response from server. */
const isMfaChallengeResponse = (
  response: LoginResponse,
): response is MfaChallengeResponse =>
  (response as MfaChallengeResponse).requires_mfa === true;

/**
 * useLoginForm
 * -----------------
 * Manages login form logic, including:
 * - Email/password login submission.
 * - Multi-Factor Authentication (MFA) verification.
 * - Password reset flow (request modal and success/error state).
 */
export function useLoginForm({
  incomingResetSuccess,
  onAuthenticated,
  onResetSuccess,
  replaceLocation,
  redirectState,
}: UseLoginFormOptions) {
  // -------------------- Basic login state --------------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));

  // -------------------- Password reset modal state --------------------
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // -------------------- Post-reset success message --------------------
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(
    () => incomingResetSuccess ?? null,
  );

  // -------------------- Multi-Factor Authentication --------------------
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  /* -------------------- Effects -------------------- */

  // Prefill reset email when reset modal opens
  useEffect(() => {
    if (isResetOpen) {
      setResetEmail((current) => current || email);
      return;
    }
    setResetError(null);
    setResetSuccess(null);
    setIsResetSubmitting(false);
  }, [isResetOpen, email]);

  // Handle incoming reset success message on navigation
  useEffect(() => {
    if (!incomingResetSuccess) return;
    setLoginSuccessMessage(incomingResetSuccess);
    replaceLocation(redirectState);
  }, [incomingResetSuccess, redirectState, replaceLocation]);

  /* -------------------- Login Logic -------------------- */

  /** Persist token + user data after successful authentication. */
  const handleLoginSuccess = useCallback(
    (data: LoginSuccessResponse) => {
      setToken(data.access_token);
      setStoredUser(data.user);
      setRole((data.user as { role?: string }).role || null);
      setHasToken(true);
      onAuthenticated();
    },
    [onAuthenticated],
  );

  /** Standard email/password login handler. */
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoginSuccessMessage(null);
      setError(null);
      setIsSubmitting(true);
      setRequiresMfa(false);
      setMfaToken(null);
      setMfaMessage(null);
      setMfaCode("");

      try {
        const data = await loginUser(email, password);

        // MFA required → show second step
        if (isMfaChallengeResponse(data)) {
          setRequiresMfa(true);
          setMfaToken(data.mfaToken);
          setMfaMessage(data.message ?? "Enter the code we emailed you.");
          setIsSubmitting(false);
          return;
        }

        handleLoginSuccess(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to sign in right now.";
        setError(message);
        setIsSubmitting(false);
      }
    },
    [email, password, handleLoginSuccess],
  );

  /** Verifies MFA code during two-step login. */
  const handleVerifyMfa = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfaToken || !mfaCode.trim()) {
        setError("Enter the 6-digit code to continue.");
        return;
      }

      setError(null);
      setIsVerifyingMfa(true);

      try {
        const data = await verifyMfaLogin(mfaToken, mfaCode.trim());
        handleLoginSuccess(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to verify the code right now.";
        setError(message);
      } finally {
        setIsVerifyingMfa(false);
      }
    },
    [handleLoginSuccess, mfaCode, mfaToken],
  );

  /** Cancels MFA step and returns to login form. */
  const handleCancelMfa = useCallback(() => {
    setRequiresMfa(false);
    setMfaToken(null);
    setMfaCode("");
    setMfaMessage(null);
    setIsSubmitting(false);
  }, []);

  /* -------------------- Password Reset Logic -------------------- */

  const openResetModal = useCallback(() => {
    setResetEmail(email);
    setIsResetOpen(true);
  }, [email]);

  const closeResetModal = useCallback(() => {
    setIsResetOpen(false);
  }, []);

  /** Sends password reset request. */
  const handleResetSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isResetSubmitting) return;

      const trimmedEmail = resetEmail.trim();
      if (!trimmedEmail) {
        setResetError("Please enter the email associated with your account.");
        return;
      }

      setIsResetSubmitting(true);
      setResetError(null);
      setResetSuccess(null);

      try {
        const message = await requestPasswordReset(trimmedEmail);
        setResetSuccess(message);
        onResetSuccess(message);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to process password reset right now.";
        setResetError(message);
      } finally {
        setIsResetSubmitting(false);
      }
    },
    [isResetSubmitting, onResetSuccess, resetEmail],
  );

  /* -------------------- UI Text -------------------- */

  const headerTitle = requiresMfa ? "Verify it's you" : "Welcome back";
  const headerSubtitle = requiresMfa
    ? mfaMessage ?? "Enter the 6-digit code we emailed you to finish signing in."
    : "Sign in to continue your projects.";

  /* -------------------- Return API -------------------- */

  return {
    // Auth state
    hasToken,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    loginSuccessMessage,
    requiresMfa,
    mfaCode,
    setMfaCode,
    mfaMessage,
    isVerifyingMfa,
    headerTitle,
    headerSubtitle,
    // Reset modal
    isResetOpen,
    resetEmail,
    setResetEmail,
    resetError,
    resetSuccess,
    isResetSubmitting,
    openResetModal,
    closeResetModal,
    handleResetSubmit,
    // Actions
    handleSubmit,
    handleVerifyMfa,
    handleCancelMfa,
  };
}

/* -------------------------------------------------------------------------- */
/*                            useRegisterForm Hook                            */
/* -------------------------------------------------------------------------- */

/**
 * useRegisterFormOptions
 * ------------------------
 * - redirectPath: Route to navigate after registration success.
 * - onRegistered: Callback after successful registration.
 */
type UseRegisterFormOptions = {
  redirectPath: string;
  onRegistered(): void;
};

/**
 * useRegisterForm
 * ----------------
 * Handles new user registration logic, including:
 * - Basic form state management.
 * - Password confirmation and validation.
 * - Error handling for existing users or server errors.
 */
export function useRegisterForm({
  redirectPath,
  onRegistered,
}: UseRegisterFormOptions) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasToken = useMemo(() => Boolean(getToken()), []);

  /** Registration submission handler. */
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setIsSubmitting(true);

      try {
        await registerUser(username.trim(), email.trim(), password);
        onRegistered();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to sign up right now.";
        setError(message);
        setIsSubmitting(false);
      }
    },
    [confirmPassword, email, onRegistered, password, username],
  );

  return {
    hasToken,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    isSubmitting,
    redirectPath,
    handleSubmit,
  };
}

/* -------------------------------------------------------------------------- */
/*                         useResetPasswordForm Hook                          */
/* -------------------------------------------------------------------------- */

/**
 * useResetPasswordFormOptions
 * ------------------------------
 * - token: Reset token provided in the URL.
 * - onSuccess: Callback triggered after successful reset.
 */
type UseResetPasswordFormOptions = {
  token: string;
  onSuccess(message: string): void;
};

/**
 * useResetPasswordForm
 * ----------------------
 * Handles the password reset form logic:
 * - Validates token and password length.
 * - Confirms password match.
 * - Submits to the resetPassword API endpoint.
 */
export function useResetPasswordForm({
  token,
  onSuccess,
}: UseResetPasswordFormOptions) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    token ? null : "Reset token missing. Open the link from your email again.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Handles password reset submission. */
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;

      const trimmedToken = token.trim();
      if (!trimmedToken) {
        setError("Reset token missing. Open the link from your email again.");
        return;
      }

      if (!password) {
        setError("Please enter a new password.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const message = await resetPassword(trimmedToken, password);
        setIsSubmitting(false);
        onSuccess(message);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to reset password right now.";
        setError(message);
        setIsSubmitting(false);
      }
    },
    [confirmPassword, isSubmitting, onSuccess, password, token],
  );

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    isSubmitting,
    handleSubmit,
  };
}

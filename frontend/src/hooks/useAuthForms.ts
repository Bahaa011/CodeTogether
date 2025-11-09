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

type UseLoginFormOptions = {
  incomingResetSuccess?: string | null;
  onAuthenticated(): void;
  onResetSuccess(message: string): void;
  replaceLocation(state?: Record<string, unknown>): void;
  redirectState?: Record<string, unknown>;
};

const isMfaChallengeResponse = (
  response: LoginResponse,
): response is MfaChallengeResponse =>
  (response as MfaChallengeResponse).requires_mfa === true;

export function useLoginForm({
  incomingResetSuccess,
  onAuthenticated,
  onResetSuccess,
  replaceLocation,
  redirectState,
}: UseLoginFormOptions) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(
    () => incomingResetSuccess ?? null,
  );
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  useEffect(() => {
    if (isResetOpen) {
      setResetEmail((current) => current || email);
      return;
    }

    setResetError(null);
    setResetSuccess(null);
    setIsResetSubmitting(false);
  }, [isResetOpen, email]);

  useEffect(() => {
    if (!incomingResetSuccess) {
      return;
    }

    setLoginSuccessMessage(incomingResetSuccess);
    replaceLocation(redirectState);
  }, [incomingResetSuccess, redirectState, replaceLocation]);

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

  const handleCancelMfa = useCallback(() => {
    setRequiresMfa(false);
    setMfaToken(null);
    setMfaCode("");
    setMfaMessage(null);
    setIsSubmitting(false);
  }, []);

  const openResetModal = useCallback(() => {
    setResetEmail(email);
    setIsResetOpen(true);
  }, [email]);

  const closeResetModal = useCallback(() => {
    setIsResetOpen(false);
  }, []);

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

  const headerTitle = requiresMfa ? "Verify it's you" : "Welcome back";
  const headerSubtitle = requiresMfa
    ? mfaMessage ?? "Enter the 6-digit code we emailed you to finish signing in."
    : "Sign in to continue your projects.";

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

type UseRegisterFormOptions = {
  redirectPath: string;
  onRegistered(): void;
};

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

type UseResetPasswordFormOptions = {
  token: string;
  onSuccess(message: string): void;
};

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

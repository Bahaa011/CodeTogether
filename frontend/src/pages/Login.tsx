import { type FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import {
  loginUser,
  requestPasswordReset,
  verifyMfaLogin,
  type LoginSuccessResponse,
} from "../services/authService";
import { getToken, setRole, setStoredUser, setToken } from "../utils/auth";
import "../styles/auth.css";

type LocationState = {
  from?: string;
  resetSuccess?: string;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const redirectFrom = locationState?.from;
  const incomingResetSuccess = locationState?.resetSuccess;

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

  const redirectPath = redirectFrom || "/";

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
    navigate(location.pathname, {
      replace: true,
      state: redirectFrom ? { from: redirectFrom } : undefined,
    });
  }, [incomingResetSuccess, redirectFrom, location.pathname, navigate]);

  if (hasToken) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleLoginSuccess = (data: LoginSuccessResponse) => {
    setToken(data.access_token);
    setStoredUser(data.user);
    setRole((data.user as { role?: string }).role || null);
    setHasToken(true);
    navigate(redirectPath, { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      if ("requires_mfa" in data && data.requires_mfa) {
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
  };

  const handleVerifyMfa = async (event: FormEvent<HTMLFormElement>) => {
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
  };

  const handleCancelMfa = () => {
    setRequiresMfa(false);
    setMfaToken(null);
    setMfaCode("");
    setMfaMessage(null);
    setIsSubmitting(false);
  };

  const openResetModal = () => {
    setResetEmail(email);
    setIsResetOpen(true);
  };

  const closeResetModal = () => {
    setIsResetOpen(false);
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to process password reset right now.";
      setResetError(message);
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const headerTitle = requiresMfa ? "Verify it's you" : "Welcome back";
  const headerSubtitle = requiresMfa
    ? mfaMessage ?? "Enter the 6-digit code we emailed you to finish signing in."
    : "Sign in to continue your projects.";

  return (
    <>
      <div className="auth-page">
        <section className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">{headerTitle}</h1>
            <p className="auth-subtitle">{headerSubtitle}</p>
          </div>

          {!requiresMfa && loginSuccessMessage && (
            <div className="auth-success">{loginSuccessMessage}</div>
          )}
          {error && <div className="auth-alert">{error}</div>}

          {requiresMfa ? (
            <div className="auth-mfa-card">
              <form className="auth-mfa-form" onSubmit={handleVerifyMfa}>
                <div className="auth-field">
                  <label htmlFor="login-mfa" className="auth-label">
                    6-digit code
                  </label>
                  <input
                    id="login-mfa"
                    className="auth-input auth-input--code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
                      setMfaCode(digits);
                    }}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    disabled={isVerifyingMfa}
                  />
                </div>
                <div className="auth-mfa-actions">
                  <button
                    type="button"
                    className="auth-link"
                    onClick={handleCancelMfa}
                    disabled={isVerifyingMfa}
                  >
                    Back to sign in
                  </button>
                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={isVerifyingMfa || mfaCode.length !== 6}
                  >
                    {isVerifyingMfa ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="login-email" className="auth-label">
                    Email
                  </label>
                  <input
                    id="login-email"
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="login-password" className="auth-label">
                    Password
                  </label>
                  <input
                    id="login-password"
                    className="auth-input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="auth-actions">
                  <button
                    type="button"
                    className="auth-link"
                    onClick={openResetModal}
                    disabled={isSubmitting}
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="auth-footer">
                Need an account?{" "}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() =>
                    navigate("/register", { state: { from: redirectPath } })
                  }
                  disabled={isSubmitting}
                >
                  Create one
                </button>
              </p>
            </>
          )}
        </section>
      </div>

      <Modal
        open={isResetOpen}
        onClose={closeResetModal}
        title="Reset Password"
        footer={
          <div className="modal-actions">
            <button
              type="button"
              onClick={closeResetModal}
              className="modal-button modal-button--ghost"
              disabled={isResetSubmitting}
            >
              Close
            </button>
            <button
              type="submit"
              form="forgot-password-form"
              className="modal-button modal-button--primary"
              disabled={isResetSubmitting || Boolean(resetSuccess)}
            >
              {isResetSubmitting
                ? "Sending…"
                : resetSuccess
                  ? "Email Sent"
                  : "Send Reset Link"}
            </button>
          </div>
        }
      >
        <form
          id="forgot-password-form"
          onSubmit={handleResetSubmit}
          className="modal-form"
        >
          <div className="modal-field">
            <label htmlFor="reset-email" className="modal-field__label">
              Account Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className="modal-field__control"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isResetSubmitting || Boolean(resetSuccess)}
            />
            <p className="modal-helper">
              We&apos;ll send a link to reset your password if the account
              exists.
            </p>
          </div>

          {resetError && <p className="modal-error">{resetError}</p>}
          {resetSuccess && <p className="modal-success">{resetSuccess}</p>}
        </form>
      </Modal>
    </>
  );
}

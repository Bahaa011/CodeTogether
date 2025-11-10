/**
 * Login Page
 * ------------
 * Provides the authentication interface for users to access CodeTogether.
 *
 * Features:
 * - Email/password login with real-time validation
 * - MFA (multi-factor authentication) verification flow
 * - Password reset modal (triggered within the login form)
 * - Redirects users to intended destination post-login
 *
 * Components:
 * - Modal (for password reset)
 * - useLoginForm (manages authentication logic and state)
 * - Integrated support for redirect persistence via react-router state
 */

import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useLoginForm } from "../hooks/useAuthForms";
import Modal from "../components/modal/Modal";
import "../styles/auth.css";

/**
 * LocationState
 * ---------------
 * Defines optional state passed via router navigation:
 * - from: previous protected route path
 * - resetSuccess: success message from password reset flow
 */
type LocationState = {
  from?: string;
  resetSuccess?: string;
};

export default function Login() {
  /**
   * Routing & Navigation
   * ---------------------
   * Handles incoming redirect paths and post-authentication navigation.
   */
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const redirectFrom = locationState?.from;
  const incomingResetSuccess = locationState?.resetSuccess;
  const redirectPath = redirectFrom || "/";

  /**
   * useLoginForm Hook
   * ------------------
   * Manages the authentication logic, form state, and multi-factor steps.
   * Returns:
   * - Authentication state and form fields
   * - MFA-specific handlers
   * - Password reset modal control
   */
  const {
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
    isVerifyingMfa,
    headerTitle,
    headerSubtitle,
    isResetOpen,
    resetEmail,
    setResetEmail,
    resetError,
    resetSuccess,
    isResetSubmitting,
    openResetModal,
    closeResetModal,
    handleResetSubmit,
    handleSubmit,
    handleVerifyMfa,
    handleCancelMfa,
  } = useLoginForm({
    incomingResetSuccess,
    onAuthenticated: () => navigate(redirectPath, { replace: true }),
    onResetSuccess: () => {},
    replaceLocation: (state) =>
      navigate(location.pathname, {
        replace: true,
        state: state ?? (redirectFrom ? { from: redirectFrom } : undefined),
      }),
    redirectState: redirectFrom ? { from: redirectFrom } : undefined,
  });

  /**
   * Authentication Guard
   * ---------------------
   * Redirects authenticated users immediately to their target page.
   */
  if (hasToken) {
    return <Navigate to={redirectPath} replace />;
  }

  /**
   * JSX Return
   * -----------
   * Contains both main authentication form and conditional MFA & password reset logic.
   */
  return (
    <>
      {/* ------------------ Login Card ------------------ */}
      <div className="auth-page">
        <section className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">{headerTitle}</h1>
            <p className="auth-subtitle">{headerSubtitle}</p>
          </div>

          {/* Success / Error Feedback */}
          {!requiresMfa && loginSuccessMessage && (
            <div className="auth-success">{loginSuccessMessage}</div>
          )}
          {error && <div className="auth-alert">{error}</div>}

          {/* ------------------ MFA Verification ------------------ */}
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
            /* ------------------ Standard Login Form ------------------ */
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

              {/* Registration link */}
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

      {/* ------------------ Password Reset Modal ------------------ */}
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
              We&apos;ll send a link to reset your password if the account exists.
            </p>
          </div>

          {resetError && <p className="modal-error">{resetError}</p>}
          {resetSuccess && <p className="modal-success">{resetSuccess}</p>}
        </form>
      </Modal>
    </>
  );
}

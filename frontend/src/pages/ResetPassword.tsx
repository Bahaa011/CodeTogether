import { type FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import "../styles/auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    token ? null : "Reset token missing. Open the link from your email again.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      navigate("/login", {
        replace: true,
        state: { resetSuccess: message },
      });
      return;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reset password right now.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">
            Enter a new password for your account.
          </p>
        </div>

        {error && <div className="auth-alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reset-password" className="auth-label">
              New password
            </label>
            <input
              id="reset-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Create a strong password"
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reset-confirm-password" className="auth-label">
              Confirm password
            </label>
            <input
              id="reset-confirm-password"
              className="auth-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="auth-footer">
          Remembered your password?{" "}
          <button
            type="button"
            className="auth-link"
            onClick={handleBackToLogin}
            disabled={isSubmitting}
          >
            Back to login
          </button>
        </p>
      </section>
    </div>
  );
}

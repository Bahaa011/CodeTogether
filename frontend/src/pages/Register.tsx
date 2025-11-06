import { type FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { getToken } from "../utils/auth";
import "../styles/auth.css";

type LocationState = {
  from?: string;
};

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasToken = Boolean(getToken());

  const redirectPath = (location.state as LocationState | null)?.from || "/";

  if (hasToken) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser(username.trim(), email.trim(), password);
      navigate("/login", { replace: true, state: { from: redirectPath } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to sign up right now.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">
            Join CodeTogether and start building with your team.
          </p>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="register-username" className="auth-label">
              Username
            </label>
            <input
              id="register-username"
              className="auth-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              placeholder="your-handle"
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email" className="auth-label">
              Email
            </label>
            <input
              id="register-email"
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
            <label htmlFor="register-password" className="auth-label">
              Password
            </label>
            <input
              id="register-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm" className="auth-label">
              Confirm password
            </label>
            <input
              id="register-confirm"
              className="auth-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              placeholder="Re-enter your password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <button
            type="button"
            className="auth-link"
            onClick={() =>
              navigate("/login", { state: { from: redirectPath } })
            }
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </p>
      </section>
    </div>
  );
}

/**
 * authStorage
 * -------------
 * Utility functions for managing authentication-related data in localStorage.
 *
 * Handles:
 *  - Access token (set, get, remove)
 *  - User role
 *  - Stored user profile
 *  - Dispatching global auth state events
 */

export const AUTH_TOKEN_EVENT = "auth-token-changed";
export const AUTH_USER_EVENT = "auth-user-changed";

const USER_KEY = "userProfile";

/**
 * Dispatches a custom auth-related event (token or user changes).
 */
const dispatchAuthEvent = (eventName: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(eventName));
};

// ---------------- TOKEN MANAGEMENT ----------------

/**
 * Retrieves the stored authentication token.
 * @returns The access token string, or an empty string if none exists.
 */
export const getToken = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
};

/**
 * Stores or removes the authentication token.
 * @param token - The access token to store. Removes the token if null or undefined.
 */
export const setToken = (token?: string | null): void => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
  dispatchAuthEvent(AUTH_TOKEN_EVENT);
};

/**
 * Removes the stored authentication token.
 */
export const removeToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  dispatchAuthEvent(AUTH_TOKEN_EVENT);
};

/**
 * Returns the stored token formatted as a Bearer token.
 * @returns Formatted "Bearer <token>" string, or an empty string if no token exists.
 */
export const getTokenBearer = (): string => {
  const token = getToken();
  return token ? `Bearer ${token}` : "";
};

// ---------------- ROLE MANAGEMENT ----------------

/**
 * Retrieves the stored user role.
 * @returns The user role string, or an empty string if none exists.
 */
export const getRole = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("userRole") || "";
};

/**
 * Stores or removes the user role.
 * @param role - The user role to store. Removes the role if null or undefined.
 */
export const setRole = (role?: string | null): void => {
  if (typeof window === "undefined") return;
  if (role) {
    localStorage.setItem("userRole", role);
  } else {
    localStorage.removeItem("userRole");
  }
  dispatchAuthEvent(AUTH_USER_EVENT);
};

// ---------------- USER PROFILE MANAGEMENT ----------------

/**
 * Structure of a stored user profile.
 */
export type StoredUser = {
  id: number;
  username: string;
  email: string;
  bio?: string | null;
  avatar_url?: string | null;
  mfa_enabled?: boolean;
  created_at?: string | Date;
  [key: string]: unknown;
};

/**
 * Retrieves the stored user profile.
 * @returns Parsed StoredUser object, or null if not found or invalid.
 */
export const getStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredUser & { userId?: number };

    // Fix backward compatibility with older key "userId"
    if (parsed && typeof parsed.id !== "number" && typeof parsed.userId === "number") {
      parsed.id = parsed.userId;
      delete parsed.userId;
    }

    return parsed;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

/**
 * Stores or removes the user profile.
 * @param user - The user object to store. Removes if null or undefined.
 */
export const setStoredUser = (user?: StoredUser | null): void => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  dispatchAuthEvent(AUTH_USER_EVENT);
};

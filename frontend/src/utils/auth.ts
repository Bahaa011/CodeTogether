/*
-----------------------------------------------------------------------
  Purpose: Retrieves stored authentication token from localStorage
  Returns: string - access token or empty string if none exists
-----------------------------------------------------------------------
*/
export const AUTH_TOKEN_EVENT = "auth-token-changed";
export const AUTH_USER_EVENT = "auth-user-changed";

const dispatchAuthEvent = (eventName: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(eventName));
};

export const getToken = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
};

/*
-----------------------------------------------------------------------
  Purpose: Stores or removes authentication token in localStorage
  Param: token (string) - access token to be stored or removed
  Returns: Updates localStorage with token value or removes token
-----------------------------------------------------------------------
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

/*
-----------------------------------------------------------------------
  Purpose: Removes authentication token from localStorage
  Returns: Clears access token stored in localStorage
-----------------------------------------------------------------------
*/
export const removeToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  dispatchAuthEvent(AUTH_TOKEN_EVENT);
};

/*
-----------------------------------------------------------------------
  Purpose: Formats the stored authentication token as a Bearer token
  Returns: String - formatted Bearer token or empty string if no token exists
-----------------------------------------------------------------------
*/
export const getTokenBearer = (): string => {
  const token = getToken();
  return token ? `Bearer ${token}` : "";
};

/*
-----------------------------------------------------------------------
  Purpose: Retrieves stored user role from localStorage
  Returns: string - user role or empty string if none exists
-----------------------------------------------------------------------
*/
export const getRole = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("userRole") || "";
};

/*
-----------------------------------------------------------------------
  Purpose: Stores or removes user role in localStorage
  Param: role (string) - role to be stored or removed
  Returns: Updates localStorage with role value or removes role if null
-----------------------------------------------------------------------
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

const USER_KEY = "userProfile";

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

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUser & { userId?: number };
    if (parsed && typeof parsed.id !== "number" && typeof parsed.userId === "number") {
      parsed.id = parsed.userId as unknown as number;
      delete (parsed as { userId?: number }).userId;
    }
    return parsed;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const setStoredUser = (user?: StoredUser | null): void => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  dispatchAuthEvent(AUTH_USER_EVENT);
};

/**
 * Auth API Service
 * ----------------
 * Handles all authentication-related API requests including login,
 * registration, MFA verification, password resets, and user profile retrieval.
 */

import { apiClient, buildAxiosError } from "./apiClient";
import type { StoredUser } from "../utils/auth";

/**
 * LoginSuccessResponse
 * ---------------------
 * Represents a successful login containing the user and access token.
 */
export type LoginSuccessResponse = {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    [key: string]: unknown;
  };
};

/**
 * MfaChallengeResponse
 * ---------------------
 * Represents a response indicating MFA verification is required before login completes.
 */
export type MfaChallengeResponse = {
  requires_mfa: true;
  mfaToken: string;
  message?: string;
};

/**
 * LoginResponse
 * --------------
 * Union type for either a successful login or MFA challenge response.
 */
export type LoginResponse = LoginSuccessResponse | MfaChallengeResponse;

/**
 * loginUser
 * ----------
 * Sends user credentials to the backend to initiate login.
 * May return an access token or an MFA challenge.
 */
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
    return data;
  } catch (error) {
    throw buildAxiosError("Login", error);
  }
}

/**
 * verifyMfaLogin
 * ----------------
 * Verifies the MFA code provided by the user during login.
 */
export async function verifyMfaLogin(token: string, code: string): Promise<LoginSuccessResponse> {
  try {
    const { data } = await apiClient.post<LoginSuccessResponse>("/auth/mfa/verify", {
      token,
      code,
    });
    return data;
  } catch (error) {
    throw buildAxiosError("MFA verification", error);
  }
}

/**
 * registerUser
 * --------------
 * Registers a new user with username, email, and password.
 */
export async function registerUser(username: string, email: string, password: string) {
  try {
    const { data } = await apiClient.post("/users/register", { username, email, password });
    return data;
  } catch (error) {
    throw buildAxiosError("Registration", error);
  }
}

/**
 * requestPasswordReset
 * ---------------------
 * Requests a password reset email to be sent to the specified address.
 */
export async function requestPasswordReset(email: string) {
  try {
    const { data } = await apiClient.post<{ message?: string }>(
      "/auth/forgot-password",
      { email },
    );
    return data?.message ?? "If an account exists, a reset link has been sent.";
  } catch (error) {
    throw buildAxiosError("Password reset request", error);
  }
}

/**
 * resetPassword
 * ---------------
 * Submits a new password using a valid reset token.
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    const { data } = await apiClient.post<{ message?: string }>(
      "/auth/reset-password",
      { token, newPassword },
    );
    return data?.message ?? "Password reset successfully.";
  } catch (error) {
    throw buildAxiosError("Password reset", error);
  }
}

/**
 * fetchProfile
 * --------------
 * Retrieves the authenticated user's profile data.
 */
export async function fetchProfile(): Promise<StoredUser> {
  try {
    const { data } = await apiClient.get<Partial<StoredUser> & { userId?: number }>(
      "/auth/profile",
    );
    if (typeof data.id === "number") {
      return data as StoredUser;
    }
    if (typeof data.userId === "number") {
      return {
        ...(data as Record<string, unknown>),
        id: data.userId,
      } as StoredUser;
    }
    throw new Error("Invalid profile response.");
  } catch (error) {
    throw buildAxiosError("Profile", error);
  }
}

/**
 * toggleMfa
 * -----------
 * Enables or disables multi-factor authentication for the user.
 */
export async function toggleMfa(enabled: boolean): Promise<StoredUser> {
  try {
    const { data } = await apiClient.post<StoredUser>("/auth/mfa/toggle", { enabled });
    return data;
  } catch (error) {
    throw buildAxiosError("MFA settings", error);
  }
}

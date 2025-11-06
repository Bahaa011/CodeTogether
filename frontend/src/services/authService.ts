import { apiClient, buildAxiosError } from "./apiClient";
import type { StoredUser } from "../utils/auth";

export type LoginSuccessResponse = {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    [key: string]: unknown;
  };
};

export type MfaChallengeResponse = {
  requires_mfa: true;
  mfaToken: string;
  message?: string;
};

export type LoginResponse = LoginSuccessResponse | MfaChallengeResponse;

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
    return data;
  } catch (error) {
    throw buildAxiosError("Login", error);
  }
}

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

export async function registerUser(username: string, email: string, password: string) {
  try {
    const { data } = await apiClient.post("/users/register", { username, email, password });
    return data;
  } catch (error) {
    throw buildAxiosError("Registration", error);
  }
}

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

export async function toggleMfa(enabled: boolean): Promise<StoredUser> {
  try {
    const { data } = await apiClient.post<StoredUser>("/auth/mfa/toggle", { enabled });
    return data;
  } catch (error) {
    throw buildAxiosError("MFA settings", error);
  }
}

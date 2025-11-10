/**
 * Session API Service
 * -------------------
 * Handles frontend API interactions related to user sessions,
 * including session creation, activity tracking, and termination.
 */

import { apiClient, buildAxiosError } from "./apiClient";

/**
 * SessionUser
 * ------------
 * Represents a simplified user object attached to a session.
 */
export type SessionUser = {
  id?: number | null;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

/**
 * ProjectSession
 * ---------------
 * Represents a project-related user session record.
 */
export type ProjectSession = {
  id: number;
  status: "active" | "idle" | "ended";
  last_activity: string;
  user?: SessionUser | null;
};

/**
 * createSession
 * --------------
 * Starts a new session for a specific user and project.
 */
export async function createSession(input: {
  userId: number;
  projectId: number;
}) {
  try {
    const response = await apiClient.post<ProjectSession>("/sessions", {
      user_id: input.userId,
      project_id: input.projectId,
    });
    return response.data;
  } catch (error) {
    throw buildAxiosError("Create session", error);
  }
}

/**
 * fetchActiveSessions
 * --------------------
 * Retrieves all currently active sessions for a specific project.
 */
export async function fetchActiveSessions(projectId: number) {
  try {
    const response = await apiClient.get<ProjectSession[]>(
      `/sessions/project/${projectId}/active`,
    );
    return response.data;
  } catch (error) {
    throw buildAxiosError("Fetch sessions", error);
  }
}

/**
 * endSession
 * -----------
 * Marks a user session as ended.
 */
export async function endSession(sessionId: number) {
  try {
    await apiClient.post("/sessions/end", {
      session_id: sessionId,
    });
  } catch (error) {
    throw buildAxiosError("End session", error);
  }
}

/**
 * endSessionBeacon
 * -----------------
 * Sends a lightweight beacon request to end a session
 * before page unload or navigation (optimized for background use).
 */
const API_BASE_URL = apiClient.defaults.baseURL ?? "";

export function endSessionBeacon(sessionId: number): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.sendBeacon !== "function" ||
    !API_BASE_URL
  ) {
    return false;
  }
  try {
    const payload = JSON.stringify({ session_id: sessionId });
    const blob = new Blob([payload], { type: "application/json" });
    return navigator.sendBeacon(`${API_BASE_URL}/sessions/end`, blob);
  } catch {
    return false;
  }
}

/**
 * fetchLongSessionCount
 * ----------------------
 * Retrieves the number of sessions with unusually long durations for a user.
 */
export async function fetchLongSessionCount(userId: number) {
  try {
    const response = await apiClient.get<{ count: number }>(
      `/sessions/user/${userId}/long`,
    );
    return response.data.count;
  } catch (error) {
    throw buildAxiosError("Fetch session insights", error);
  }
}

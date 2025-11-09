import { apiClient, buildAxiosError } from "./apiClient";

export type SessionUser = {
  id?: number | null;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

export type ProjectSession = {
  id: number;
  status: "active" | "idle" | "ended";
  last_activity: string;
  user?: SessionUser | null;
};

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

export async function endSession(sessionId: number) {
  try {
    await apiClient.post("/sessions/end", {
      session_id: sessionId,
    });
  } catch (error) {
    throw buildAxiosError("End session", error);
  }
}

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

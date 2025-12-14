import { apolloClient } from "./client";
import { formatGraphQLError } from "./error";
import {
  CREATE_SESSION_MUTATION,
  END_SESSION_MUTATION,
  GET_ACTIVE_SESSIONS_BY_PROJECT,
  GET_LONG_SESSION_COUNT_BY_USER,
} from "./session.queries";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? window.location.origin : undefined) ??
  "http://localhost:3000"
).replace(/\/+$/, "");

export type SessionUser = {
  id?: number | null;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

export type ProjectSession = {
  id: number;
  status: "active" | "idle" | "ended";
  started_at?: string;
  ended_at?: string | null;
  last_activity?: string | null;
  user?: SessionUser | null;
};

type GqlSession = {
  id: number;
  status?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  last_activity?: string | null;
  user?: {
    id?: number | null;
    username?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
};

const mapSession = (session?: GqlSession | null): ProjectSession => {
  if (!session) throw new Error("Session payload missing.");
  const status = (session.status ?? "active") as ProjectSession["status"];
  return {
    id: session.id,
    status,
    started_at: session.started_at ?? undefined,
    ended_at: session.ended_at ?? undefined,
    last_activity: session.last_activity ?? undefined,
    user: session.user ?? undefined,
  };
};

export async function createSession(input: {
  userId: number;
  projectId: number;
}): Promise<ProjectSession> {
  try {
    const { data } = await apolloClient.mutate<{ startSession?: GqlSession }>({
      mutation: CREATE_SESSION_MUTATION,
      variables: { input: { userId: Number(input.userId), projectId: Number(input.projectId) } },
    });
    const created = data?.startSession;
    if (!created) throw new Error("Unable to start session.");
    return mapSession(created);
  } catch (error) {
    throw formatGraphQLError("Create session", error);
  }
}

export async function fetchActiveSessions(
  projectId: number,
): Promise<ProjectSession[]> {
  try {
    const numericId = Number(projectId);
    const { data } = await apolloClient.query<{
      activeSessionsByProject?: GqlSession[];
    }>({
      query: GET_ACTIVE_SESSIONS_BY_PROJECT,
      variables: { projectId: numericId },
      fetchPolicy: "network-only",
    });
    return (data?.activeSessionsByProject ?? []).map((session) => mapSession(session));
  } catch (error) {
    throw formatGraphQLError("Fetch sessions", error);
  }
}

export async function endSession(sessionId: number): Promise<boolean> {
  try {
    const numericId = Number(sessionId);
    const { data } = await apolloClient.mutate<{ endSession?: boolean }>({
      mutation: END_SESSION_MUTATION,
      variables: { sessionId: numericId },
    });
    return Boolean(data?.endSession);
  } catch (error) {
    throw formatGraphQLError("End session", error);
  }
}

export function endSessionBeacon(sessionId: number): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.sendBeacon !== "function" ||
    !API_BASE_URL
  ) {
    return false;
  }

  try {
    const payload = JSON.stringify({
      query: "mutation EndSessionBeacon($sessionId: Int!) { endSession(sessionId: $sessionId) }",
      variables: { sessionId: Number(sessionId) },
    });
    const blob = new Blob([payload], { type: "application/json" });
    return navigator.sendBeacon(`${API_BASE_URL}/graphql`, blob);
  } catch {
    return false;
  }
}

export async function fetchLongSessionCount(userId: number): Promise<number> {
  try {
    const numericId = Number(userId);
    const { data } = await apolloClient.query<{
      longSessionCountByUser?: number;
    }>({
      query: GET_LONG_SESSION_COUNT_BY_USER,
      variables: { userId: numericId },
      fetchPolicy: "network-only",
    });
    return data?.longSessionCountByUser ?? 0;
  } catch (error) {
    throw formatGraphQLError("Fetch session insights", error);
  }
}

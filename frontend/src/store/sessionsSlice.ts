import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  createSession,
  endSession,
  fetchActiveSessions,
  endSessionBeacon,
  type ProjectSession,
} from "../graphql/session.api";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

type SessionRecord = {
  sessions: ProjectSession[];
  loadStatus: AsyncStatus;
  loadError: string | null;
  creating: boolean;
  createError: string | null;
  ending: boolean;
  endError: string | null;
};

type SessionsState = {
  byProjectId: Record<number, SessionRecord>;
};

const createRecord = (): SessionRecord => ({
  sessions: [],
  loadStatus: "idle",
  loadError: null,
  creating: false,
  createError: null,
  ending: false,
  endError: null,
});

const ensureRecord = (state: SessionsState, projectId: number) => {
  if (!state.byProjectId[projectId]) {
    state.byProjectId[projectId] = createRecord();
  }
  return state.byProjectId[projectId];
};

const initialState: SessionsState = {
  byProjectId: {},
};

export const loadActiveSessionsForProject = createAsyncThunk<
  { projectId: number; sessions: ProjectSession[] },
  number,
  { rejectValue: string }
>(
  "sessions/loadActive",
  async (projectId, { rejectWithValue }) => {
    try {
      const sessions = await fetchActiveSessions(projectId);
      return { projectId, sessions };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load sessions.";
      return rejectWithValue(message);
    }
  },
);

export const startProjectSession = createAsyncThunk<
  { projectId: number; session: ProjectSession },
  { projectId: number; userId: number },
  { rejectValue: string }
>(
  "sessions/start",
  async ({ projectId, userId }, { rejectWithValue }) => {
    try {
      const session = await createSession({ projectId, userId });
      return { projectId, session };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start session.";
      return rejectWithValue(message);
    }
  },
);

export const finishProjectSession = createAsyncThunk<
  { projectId: number; sessionId: number },
  { projectId: number; sessionId: number },
  { rejectValue: string }
>(
  "sessions/finish",
  async ({ projectId, sessionId }, { rejectWithValue }) => {
    try {
      await endSession(sessionId);
      return { projectId, sessionId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to end session.";
      return rejectWithValue(message);
    }
  },
);

export const sendSessionBeacon = createAsyncThunk<
  { sessionId: number; success: boolean },
  { sessionId: number },
  { rejectValue: string }
>("sessions/sendBeacon", async ({ sessionId }, { rejectWithValue }) => {
  try {
    const success = endSessionBeacon(sessionId);
    if (!success) throw new Error("Beacon failed");
    return { sessionId, success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to end session.";
    return rejectWithValue(message);
  }
});

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    clearSessionsForProject(state, action: PayloadAction<number | undefined>) {
      const projectId = action.payload;
      if (typeof projectId === "number") {
        delete state.byProjectId[projectId];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadActiveSessionsForProject.pending, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.loadStatus = "loading";
        record.loadError = null;
      })
      .addCase(loadActiveSessionsForProject.fulfilled, (state, action) => {
        const record = ensureRecord(state, action.payload.projectId);
        record.sessions = action.payload.sessions;
        record.loadStatus = "succeeded";
        record.loadError = null;
      })
      .addCase(loadActiveSessionsForProject.rejected, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.loadStatus = "failed";
        record.loadError =
          action.payload ?? "Unable to load sessions.";
      })
      .addCase(startProjectSession.pending, (state, action) => {
        const record = ensureRecord(state, action.meta.arg.projectId);
        record.creating = true;
        record.createError = null;
      })
      .addCase(startProjectSession.fulfilled, (state, action) => {
        const record = ensureRecord(state, action.payload.projectId);
        record.creating = false;
        record.sessions = [...record.sessions, action.payload.session];
        record.createError = null;
      })
      .addCase(startProjectSession.rejected, (state, action) => {
        const record = ensureRecord(state, action.meta.arg.projectId);
        record.creating = false;
        record.createError =
          action.payload ?? "Unable to start session.";
      })
      .addCase(finishProjectSession.pending, (state, action) => {
        const record = ensureRecord(state, action.meta.arg.projectId);
        record.ending = true;
        record.endError = null;
      })
      .addCase(finishProjectSession.fulfilled, (state, action) => {
        const record = ensureRecord(state, action.payload.projectId);
        record.ending = false;
        record.sessions = record.sessions.filter(
          (session) => session.id !== action.payload.sessionId,
        );
        record.endError = null;
      })
      .addCase(finishProjectSession.rejected, (state, action) => {
        const record = ensureRecord(state, action.meta.arg.projectId);
        record.ending = false;
        record.endError =
          action.payload ?? "Unable to end session.";
      });
  },
});

export const { clearSessionsForProject } = sessionsSlice.actions;
export default sessionsSlice.reducer;

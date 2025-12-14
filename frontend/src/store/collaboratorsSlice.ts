/**
 * Collaborators slice tracks project collaborators plus invite/response flows.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchCollaboratorsByProject,
  inviteCollaborator,
  removeCollaborator,
  respondToCollaboratorInvite,
  type CollaboratorRecord,
} from "../graphql/collaborator.api";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

type CollaboratorsRecord = {
  list: CollaboratorRecord[];
  status: AsyncStatus;
  error: string | null;
};

type CollaboratorsState = {
  byProjectId: Record<number, CollaboratorsRecord>;
};

const createRecord = (): CollaboratorsRecord => ({
  list: [],
  status: "idle",
  error: null,
});

const ensureRecord = (state: CollaboratorsState, projectId: number) => {
  if (!state.byProjectId[projectId]) {
    state.byProjectId[projectId] = createRecord();
  }
  return state.byProjectId[projectId];
};

const initialState: CollaboratorsState = {
  byProjectId: {},
};

/**
 * Loads collaborators for a given project id.
 */
export const loadCollaboratorsForProject = createAsyncThunk<
  CollaboratorRecord[],
  number,
  { rejectValue: string }
>(
  "collaborators/loadForProject",
  async (projectId, { rejectWithValue }) => {
    try {
      return await fetchCollaboratorsByProject(projectId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load collaborators.";
      return rejectWithValue(message);
    }
  },
);

/**
 * Responds to an invite notification (accept/decline).
 */
export const respondToCollaboratorInviteThunk = createAsyncThunk<
  { message: string; accepted?: boolean },
  { notificationId: number; userId: number; accept: boolean },
  { rejectValue: string }
>("collaborators/respondInvite", async (payload, { rejectWithValue }) => {
  try {
    return await respondToCollaboratorInvite(payload.notificationId, {
      userId: payload.userId,
      accept: payload.accept,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to respond to invitation.";
    return rejectWithValue(message);
  }
});

/**
 * Sends a collaborator invite by email/username for a project.
 */
export const inviteCollaboratorThunk = createAsyncThunk<
  { message: string },
  { inviterId: number; projectId: number; inviteeIdentifier: string },
  { rejectValue: string }
>("collaborators/invite", async (payload, { rejectWithValue }) => {
  try {
    return await inviteCollaborator({
      inviterId: payload.inviterId,
      projectId: payload.projectId,
      inviteeIdentifier: payload.inviteeIdentifier,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send invitation.";
    return rejectWithValue(message);
  }
});

/**
 * Removes a collaborator from a project and updates local list.
 */
export const removeCollaboratorThunk = createAsyncThunk<
  { projectId: number; collaboratorId: number },
  { projectId: number; collaboratorId: number },
  { rejectValue: string }
>("collaborators/remove", async ({ projectId, collaboratorId }, { rejectWithValue }) => {
  try {
    const ok = await removeCollaborator(collaboratorId);
    if (!ok) throw new Error("Unable to remove collaborator.");
    return { projectId, collaboratorId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to remove collaborator.";
    return rejectWithValue(message);
  }
});

const collaboratorsSlice = createSlice({
  name: "collaborators",
  initialState,
  reducers: {
    // Locally removes a collaborator from a project's list.
    removeCollaboratorFromProject(
      state,
      action: PayloadAction<{ projectId: number; collaboratorId: number }>,
    ) {
      const { projectId, collaboratorId } = action.payload;
      const record = state.byProjectId[projectId];
      if (!record) return;
      record.list = record.list.filter((item) => item.id !== collaboratorId);
    },
    // Clears collaborator cache for a project.
    clearCollaboratorsForProject(state, action: PayloadAction<number | undefined>) {
      const projectId = action.payload;
      if (typeof projectId === "number") {
        delete state.byProjectId[projectId];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCollaboratorsForProject.pending, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.status = "loading";
        record.error = null;
      })
      .addCase(loadCollaboratorsForProject.fulfilled, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.status = "succeeded";
        record.list = action.payload;
        record.error = null;
      })
      .addCase(loadCollaboratorsForProject.rejected, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.status = "failed";
        record.error =
          action.payload ?? "Unable to load collaborators.";
      })
      .addCase(removeCollaboratorThunk.fulfilled, (state, action) => {
        const { projectId, collaboratorId } = action.payload;
        const record = state.byProjectId[projectId];
        if (!record) return;
        record.list = record.list.filter((item) => item.id !== collaboratorId);
      });
  },
});

export const {
  removeCollaboratorFromProject,
  clearCollaboratorsForProject,
} = collaboratorsSlice.actions;
export default collaboratorsSlice.reducer;

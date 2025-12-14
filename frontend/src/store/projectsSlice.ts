/**
 * Projects slice manages public project listings plus per-project detail CRUD and status.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchProjectById,
  fetchProjects as fetchProjectsApi,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  createProject as createProjectApi,
  type Project,
} from "../graphql/project.api";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

type ProjectsState = {
  list: Project[];
  status: AsyncStatus;
  error: string | null;
  details: Record<number, { data: Project | null; status: AsyncStatus; error: string | null }>;
};

const initialState: ProjectsState = {
  list: [],
  status: "idle",
  error: null,
  details: {},
};

const ensureDetail = (
  state: ProjectsState,
  projectId: number,
): { data: Project | null; status: AsyncStatus; error: string | null } => {
  if (!state.details[projectId]) {
    state.details[projectId] = { data: null, status: "idle", error: null };
  }
  return state.details[projectId];
};

/**
 * Loads all public projects for discovery/list pages.
 */
export const loadPublicProjects = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string }
>(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const projects = await fetchProjectsApi();
      return projects;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load projects.";
      return rejectWithValue(message);
    }
  },
);

/**
 * Loads detail for a specific project id.
 */
export const loadProjectDetail = createAsyncThunk<
  { projectId: number; project: Project },
  number,
  { rejectValue: string }
>("projects/loadDetail", async (projectId, { rejectWithValue }) => {
  try {
    const project = await fetchProjectById(projectId);
    return { projectId, project };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load project.";
    return rejectWithValue(message);
  }
});

/**
 * Creates a new project owned by a user.
 */
export const createProject = createAsyncThunk<
  Project,
  {
    title: string;
    description: string;
    owner_id: number;
    is_public?: boolean;
    tags?: string[];
  },
  { rejectValue: string }
>("projects/create", async (payload, { rejectWithValue }) => {
  try {
    return await createProjectApi(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create project.";
    return rejectWithValue(message);
  }
});

type UpdateProjectInput = {
  title?: string;
  description?: string;
  is_public?: boolean;
  tags?: string[];
};

/**
 * Updates an existing project's fields.
 */
export const updateProjectThunk = createAsyncThunk<
  Project,
  { projectId: number; input: UpdateProjectInput },
  { rejectValue: string }
>("projects/update", async ({ projectId, input }, { rejectWithValue }) => {
  try {
    const updated = await updateProjectApi(projectId, input);
    return updated;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update project.";
    return rejectWithValue(message);
  }
});

/**
 * Deletes a project and prunes it from cached lists/details.
 */
export const deleteProjectThunk = createAsyncThunk<
  number,
  { projectId: number },
  { rejectValue: string }
>("projects/delete", async ({ projectId }, { rejectWithValue }) => {
  try {
    const ok = await deleteProjectApi(projectId);
    if (!ok) throw new Error("Unable to delete project.");
    return projectId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete project.";
    return rejectWithValue(message);
  }
});

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // Seeds or clears a project's detail entry manually.
    setProjectDetail(
      state,
      action: PayloadAction<{ projectId: number; project: Project | null }>,
    ) {
      const { projectId, project } = action.payload;
      const record = ensureDetail(state, projectId);
      record.data = project;
      record.status = "succeeded";
      record.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPublicProjects.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadPublicProjects.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
        state.error = null;
      })
      .addCase(loadPublicProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to load projects.";
      })
      .addCase(loadProjectDetail.pending, (state, action) => {
        const record = ensureDetail(state, action.meta.arg);
        record.status = "loading";
        record.error = null;
      })
      .addCase(loadProjectDetail.fulfilled, (state, action) => {
        const record = ensureDetail(state, action.payload.projectId);
        record.status = "succeeded";
        record.data = action.payload.project;
        record.error = null;
      })
      .addCase(loadProjectDetail.rejected, (state, action) => {
        const record = ensureDetail(state, action.meta.arg);
        record.status = "failed";
        record.error = action.payload ?? "Unable to load project.";
        record.data = null;
      })
      .addCase(createProject.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        state.list.push(action.payload);
        state.details[action.payload.id] = {
          data: action.payload,
          status: "succeeded",
          error: null,
        };
      })
      .addCase(createProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to create project.";
      })
      .addCase(updateProjectThunk.fulfilled, (state, action) => {
        const project = action.payload;
        const idx = state.list.findIndex((p) => p.id === project.id);
        if (idx >= 0) state.list[idx] = project;
        state.details[project.id] = {
          data: project,
          status: "succeeded",
          error: null,
        };
      })
      .addCase(deleteProjectThunk.fulfilled, (state, action) => {
        const projectId = action.payload;
        state.list = state.list.filter((p) => p.id !== projectId);
        delete state.details[projectId];
      });
  },
});

export const { setProjectDetail } = projectsSlice.actions;
export default projectsSlice.reducer;

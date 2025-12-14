/**
 * Portfolio slice aggregates per-user portfolio stats, owned projects, and collaborations.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchProjectCount,
  fetchProjectsByOwner,
  type Project,
} from "../graphql/project.api";
import {
  fetchCollaborationCount,
  fetchCollaborationsByUser,
  type UserCollaboration,
} from "../graphql/collaborator.api";
import { fetchLongSessionCount } from "../graphql/session.api";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export type ProfileStats = {
  projects: number;
  collaborations: number;
  sessions: number;
};

type PortfolioRecord = {
  stats: ProfileStats;
  statsStatus: AsyncStatus;
  statsError: string | null;
  projects: Project[];
  projectsStatus: AsyncStatus;
  projectsError: string | null;
  collaborations: UserCollaboration[];
  collaborationsStatus: AsyncStatus;
  collaborationsError: string | null;
};

type PortfolioState = {
  byUserId: Record<number, PortfolioRecord>;
};

const createPortfolioRecord = (): PortfolioRecord => ({
  stats: { projects: 0, collaborations: 0, sessions: 0 },
  statsStatus: "idle",
  statsError: null,
  projects: [],
  projectsStatus: "idle",
  projectsError: null,
  collaborations: [],
  collaborationsStatus: "idle",
  collaborationsError: null,
});

const initialState: PortfolioState = {
  byUserId: {},
};

const ensureRecord = (state: PortfolioState, userId: number) => {
  if (!state.byUserId[userId]) {
    state.byUserId[userId] = createPortfolioRecord();
  }
  return state.byUserId[userId];
};

type FetchUserPortfolioArgs = {
  userId: number;
  errorMessage?: string;
};

/**
 * Loads portfolio stats, owned projects, and collaborations for a user.
 */
export const fetchUserPortfolio = createAsyncThunk<
  {
    userId: number;
    stats: ProfileStats;
    projects: Project[];
    collaborations: UserCollaboration[];
  },
  FetchUserPortfolioArgs,
  { rejectValue: string }
>(
  "portfolio/fetchUserPortfolio",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const [projectsCount, collaborationsCount, longSessionCount, ownedProjects, userCollaborations] =
        await Promise.all([
          fetchProjectCount(userId),
          fetchCollaborationCount(userId),
          fetchLongSessionCount(userId),
          fetchProjectsByOwner(userId),
          fetchCollaborationsByUser(userId),
        ]);

      return {
        userId,
        stats: {
          projects: projectsCount,
          collaborations: collaborationsCount,
          sessions: longSessionCount,
        },
        projects: ownedProjects,
        collaborations: userCollaborations,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load statistics.";
      return rejectWithValue(message);
    }
  },
);

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    // Clears cached portfolio for a single user.
    clearPortfolioForUser(state, action: PayloadAction<number | undefined>) {
      const userId = action.payload;
      if (typeof userId === "number") {
        delete state.byUserId[userId];
      }
    },
    // Clears all cached portfolio entries.
    clearAllPortfolios(state) {
      state.byUserId = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPortfolio.pending, (state, action) => {
        const record = ensureRecord(state, action.meta.arg.userId);
        record.statsStatus = "loading";
        record.projectsStatus = "loading";
        record.collaborationsStatus = "loading";
        record.statsError = null;
        record.projectsError = null;
        record.collaborationsError = null;
        record.projects = [];
        record.collaborations = [];
      })
      .addCase(fetchUserPortfolio.fulfilled, (state, action) => {
        const { userId, stats, projects, collaborations } = action.payload;
        const record = ensureRecord(state, userId);
        record.stats = stats;
        record.projects = projects;
        record.collaborations = collaborations;
        record.statsStatus = "succeeded";
        record.projectsStatus = "succeeded";
        record.collaborationsStatus = "succeeded";
        record.statsError = null;
        record.projectsError = null;
        record.collaborationsError = null;
      })
      .addCase(fetchUserPortfolio.rejected, (state, action) => {
        const record = ensureRecord(state, action.meta.arg.userId);
        const message =
          action.payload ?? action.meta.arg.errorMessage ?? "Unable to load statistics.";
        record.statsStatus = "failed";
        record.projectsStatus = "failed";
        record.collaborationsStatus = "failed";
        record.statsError = message;
        record.projectsError = message;
        record.collaborationsError = message;
        record.projects = [];
        record.collaborations = [];
      });
  },
});

export const { clearPortfolioForUser, clearAllPortfolios } = portfolioSlice.actions;
export default portfolioSlice.reducer;

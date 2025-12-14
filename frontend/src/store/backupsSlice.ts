/**
 * Backups slice tracks version history per file and the load status/errors for backups.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchFileBackups, type VersionRecord } from "../graphql/version.api";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

type BackupRecord = {
  list: VersionRecord[];
  status: AsyncStatus;
  error: string | null;
};

type BackupsState = {
  byFileId: Record<number, BackupRecord>;
};

const createRecord = (): BackupRecord => ({
  list: [],
  status: "idle",
  error: null,
});

const ensureRecord = (state: BackupsState, fileId: number) => {
  if (!state.byFileId[fileId]) {
    state.byFileId[fileId] = createRecord();
  }
  return state.byFileId[fileId];
};

const initialState: BackupsState = {
  byFileId: {},
};

/**
 * Loads version backups for a given file id.
 */
export const loadBackupsForFile = createAsyncThunk<
  { fileId: number; backups: VersionRecord[] },
  number,
  { rejectValue: string }
>(
  "backups/loadByFile",
  async (fileId, { rejectWithValue }) => {
    try {
      const backups = await fetchFileBackups(fileId);
      return { fileId, backups };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load backups.";
      return rejectWithValue(message);
    }
  },
);

const backupsSlice = createSlice({
  name: "backups",
  initialState,
  reducers: {
    // Clears cached backups for a specific file.
    clearBackupsForFile(state, action: PayloadAction<number | undefined>) {
      const fileId = action.payload;
      if (typeof fileId === "number") {
        delete state.byFileId[fileId];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBackupsForFile.pending, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.status = "loading";
        record.error = null;
      })
      .addCase(loadBackupsForFile.fulfilled, (state, action) => {
        const record = ensureRecord(state, action.payload.fileId);
        record.status = "succeeded";
        record.list = action.payload.backups;
        record.error = null;
      })
      .addCase(loadBackupsForFile.rejected, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.status = "failed";
        record.error =
          action.payload ?? "Unable to load backups.";
      });
  },
});

export const { clearBackupsForFile } = backupsSlice.actions;
export default backupsSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createVersionBackup, revertVersionBackup } from "../graphql/version.api";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

type VersionState = {
  createStatus: AsyncStatus;
  createError: string | null;
  revertStatus: AsyncStatus;
  revertError: string | null;
};

const initialState: VersionState = {
  createStatus: "idle",
  createError: null,
  revertStatus: "idle",
  revertError: null,
};

export const createVersionBackupThunk = createAsyncThunk<
  { message?: string | null },
  {
    fileId: number;
    content: string;
    userId?: number;
    label: string;
  },
  { rejectValue: string }
>("version/createBackup", async (payload, { rejectWithValue }) => {
  try {
    return await createVersionBackup(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create backup.";
    return rejectWithValue(message);
  }
});

export const revertVersionBackupThunk = createAsyncThunk<
  { id?: number; content?: string | null },
  { versionId: number },
  { rejectValue: string }
>("version/revertBackup", async ({ versionId }, { rejectWithValue }) => {
  try {
    const result = await revertVersionBackup(versionId);
    if (!result) throw new Error("Failed to revert backup.");
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revert backup.";
    return rejectWithValue(message);
  }
});

const versionSlice = createSlice({
  name: "version",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createVersionBackupThunk.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createVersionBackupThunk.fulfilled, (state) => {
        state.createStatus = "succeeded";
        state.createError = null;
      })
      .addCase(createVersionBackupThunk.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload ?? "Failed to create backup.";
      })
      .addCase(revertVersionBackupThunk.pending, (state) => {
        state.revertStatus = "loading";
        state.revertError = null;
      })
      .addCase(revertVersionBackupThunk.fulfilled, (state) => {
        state.revertStatus = "succeeded";
        state.revertError = null;
      })
      .addCase(revertVersionBackupThunk.rejected, (state, action) => {
        state.revertStatus = "failed";
        state.revertError = action.payload ?? "Failed to revert backup.";
      });
  },
});

export default versionSlice.reducer;

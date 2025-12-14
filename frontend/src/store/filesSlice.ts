import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchProjectFiles,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
  type ProjectFile,
} from "../graphql/file.api";

const deriveFileType = (filename: string): string => {
  const normalized = filename.toLowerCase();
  const extension = normalized.split(".").pop() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    markdown: "markdown",
    py: "python",
    java: "java",
    c: "c",
    h: "c",
    cpp: "cpp",
    hpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    swift: "swift",
    kt: "kotlin",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    dockerfile: "dockerfile",
    env: "properties",
    txt: "plaintext",
  };
  return map[extension] ?? (extension || "plaintext");
};

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export type EditorFileState = ProjectFile & {
  draftContent: string;
  dirty: boolean;
  saving: boolean;
  saveError: string | null;
};

type ProjectFilesRecord = {
  files: Record<number, EditorFileState>;
  openFileIds: number[];
  activeFileId: number | null;
  status: AsyncStatus;
  error: string | null;
};

type FilesState = {
  byProjectId: Record<number, ProjectFilesRecord>;
};

const createRecord = (): ProjectFilesRecord => ({
  files: {},
  openFileIds: [],
  activeFileId: null,
  status: "idle",
  error: null,
});

const normalize = (files: ProjectFile[]): ProjectFilesRecord => {
  const sorted = [...files].sort((a, b) => a.filename.localeCompare(b.filename));
  const map: Record<number, EditorFileState> = {};
  for (const file of sorted) {
    map[file.id] = {
      ...file,
      draftContent: file.content ?? "",
      dirty: false,
      saving: false,
      saveError: null,
    };
  }
  const firstId = sorted[0]?.id ?? null;
  return {
    files: map,
    openFileIds: firstId ? [firstId] : [],
    activeFileId: firstId,
    status: "succeeded",
    error: null,
  };
};

const ensureRecord = (state: FilesState, projectId: number) => {
  if (!state.byProjectId[projectId]) {
    state.byProjectId[projectId] = createRecord();
  }
  return state.byProjectId[projectId];
};

const initialState: FilesState = {
  byProjectId: {},
};

export const loadProjectFiles = createAsyncThunk<
  { projectId: number; files: ProjectFile[] },
  number,
  { rejectValue: string }
>(
  "files/loadProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const files = await fetchProjectFiles(projectId);
      return { projectId, files };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load files.";
      return rejectWithValue(message);
    }
  },
);

export const createFileThunk = createAsyncThunk<
  { projectId: number; file: ProjectFile },
  {
    projectId: number;
    currentUserId: number;
    filename: string;
    content?: string;
  },
  { rejectValue: string }
>("files/create", async (payload, { rejectWithValue }) => {
  try {
    const trimmedName = payload.filename.trim();
    if (!trimmedName) throw new Error("Filename is required.");
    const file_type = deriveFileType(trimmedName);
    const created = await createProjectFile({
      filename: trimmedName,
      file_type,
      content: payload.content ?? "",
      projectId: payload.projectId,
      uploaderId: payload.currentUserId,
    });
    return { projectId: payload.projectId, file: created };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create file.";
    return rejectWithValue(message);
  }
});

export const saveFileThunk = createAsyncThunk<
  ProjectFile,
  { fileId: number; content: string },
  { rejectValue: string }
>("files/save", async ({ fileId, content }, { rejectWithValue }) => {
  try {
    const updated = await updateProjectFile(fileId, { content });
    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save file.";
    return rejectWithValue(message);
  }
});

export const deleteFileThunk = createAsyncThunk<
  { projectId: number; fileId: number },
  { projectId: number; fileId: number },
  { rejectValue: string }
>("files/delete", async ({ projectId, fileId }, { rejectWithValue }) => {
  try {
    await deleteProjectFile(fileId);
    return { projectId, fileId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete file.";
    return rejectWithValue(message);
  }
});

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    clearFilesForProject(state, action: PayloadAction<number | undefined>) {
      const projectId = action.payload;
      if (typeof projectId === "number") {
        delete state.byProjectId[projectId];
      }
    },
    openFile(state, action: PayloadAction<{ projectId: number; fileId: number }>) {
      const { projectId, fileId } = action.payload;
      const record = ensureRecord(state, projectId);
      if (!record.openFileIds.includes(fileId)) {
        record.openFileIds.push(fileId);
      }
      record.activeFileId = fileId;
    },
    closeFile(state, action: PayloadAction<{ projectId: number; fileId: number }>) {
      const { projectId, fileId } = action.payload;
      const record = ensureRecord(state, projectId);
      record.openFileIds = record.openFileIds.filter((id) => id !== fileId);
      if (record.activeFileId === fileId) {
        record.activeFileId =
          record.openFileIds.length > 0 ? record.openFileIds[0] : null;
      }
    },
    setActiveFile(state, action: PayloadAction<{ projectId: number; fileId: number | null }>) {
      const { projectId, fileId } = action.payload;
      const record = ensureRecord(state, projectId);
      record.activeFileId = fileId;
      if (fileId && !record.openFileIds.includes(fileId)) {
        record.openFileIds.push(fileId);
      }
    },
    updateFileDraft(
      state,
      action: PayloadAction<{
        projectId: number;
        fileId: number;
        draftContent: string;
      }>,
    ) {
      const { projectId, fileId, draftContent } = action.payload;
      const record = ensureRecord(state, projectId);
      const file = record.files[fileId];
      if (!file) return;
      record.files[fileId] = {
        ...file,
        draftContent,
        dirty: draftContent !== (file.content ?? ""),
        saveError: null,
      };
    },
    markFileSaving(
      state,
      action: PayloadAction<{ projectId: number; fileId: number; saving: boolean }>,
    ) {
      const { projectId, fileId, saving } = action.payload;
      const record = ensureRecord(state, projectId);
      const file = record.files[fileId];
      if (!file) return;
      record.files[fileId] = {
        ...file,
        saving,
        saveError: null,
      };
    },
    markFileSaved(
      state,
      action: PayloadAction<{
        projectId: number;
        fileId: number;
        content: string;
        metadata?: Partial<ProjectFile>;
      }>,
    ) {
      const { projectId, fileId, content, metadata } = action.payload;
      const record = ensureRecord(state, projectId);
      const file = record.files[fileId];
      if (!file) return;
      record.files[fileId] = {
        ...file,
        draftContent: content,
        content,
        dirty: false,
        saving: false,
        saveError: null,
        filename: metadata?.filename ?? file.filename,
        file_type: metadata?.file_type ?? file.file_type,
        updated_at: metadata?.updated_at ?? file.updated_at,
      };
    },
    setFileError(
      state,
      action: PayloadAction<{ projectId: number; fileId: number; error: string }>,
    ) {
      const { projectId, fileId, error } = action.payload;
      const record = ensureRecord(state, projectId);
      const file = record.files[fileId];
      if (!file) return;
        record.files[fileId] = {
          ...file,
          saving: false,
          saveError: error,
        };
      },
    addFile(
      state,
      action: PayloadAction<{ projectId: number; file: EditorFileState }>,
    ) {
      const { projectId, file } = action.payload;
      const record = ensureRecord(state, projectId);
      record.files[file.id] = file;
      if (!record.openFileIds.includes(file.id)) {
        record.openFileIds.push(file.id);
      }
      record.activeFileId = file.id;
    },
    removeFile(
      state,
      action: PayloadAction<{ projectId: number; fileId: number }>,
    ) {
      const { projectId, fileId } = action.payload;
      const record = ensureRecord(state, projectId);
      if (!record.files[fileId]) return;
      const nextFiles = { ...record.files };
      delete nextFiles[fileId];
      const nextOpenIds = record.openFileIds.filter((id) => id !== fileId);
      let nextActiveId = record.activeFileId;
      if (record.activeFileId === fileId) {
        nextActiveId =
          nextOpenIds[nextOpenIds.length - 1] ??
          (Object.keys(nextFiles).length ? Number(Object.keys(nextFiles)[0]) : null);
      }
      record.files = nextFiles;
      record.openFileIds = nextOpenIds;
      record.activeFileId = nextActiveId;
    },
    syncFileContent(
      state,
      action: PayloadAction<{
        projectId: number;
        fileId: number;
        content: string;
        markClean?: boolean;
      }>,
    ) {
      const { projectId, fileId, content, markClean = false } = action.payload;
      const record = ensureRecord(state, projectId);
      const file = record.files[fileId];
      if (!file) return;
      record.files[fileId] = {
        ...file,
        content: markClean ? content : file.content,
        draftContent: content,
        dirty: markClean ? false : content !== file.content,
        saveError: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProjectFiles.pending, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.status = "loading";
        record.error = null;
      })
      .addCase(loadProjectFiles.fulfilled, (state, action) => {
        const { projectId, files } = action.payload;
        const record = ensureRecord(state, projectId);
        const normalized = normalize(files);
        record.files = normalized.files;
        record.openFileIds = normalized.openFileIds;
        record.activeFileId = normalized.activeFileId;
        record.status = "succeeded";
        record.error = null;
      })
      .addCase(loadProjectFiles.rejected, (state, action) => {
        const record = ensureRecord(state, action.meta.arg);
        record.status = "failed";
        record.error = action.payload ?? "Unable to load files.";
        record.files = {};
        record.openFileIds = [];
        record.activeFileId = null;
      })
      .addCase(createFileThunk.fulfilled, (state, action) => {
        const { projectId, file } = action.payload;
        const record = ensureRecord(state, projectId);
        const newFileState: EditorFileState = {
          ...file,
          draftContent: file.content ?? "",
          dirty: false,
          saving: false,
          saveError: null,
        };
        record.files[file.id] = newFileState;
        if (!record.openFileIds.includes(file.id)) {
          record.openFileIds.push(file.id);
        }
        record.activeFileId = file.id;
      })
      .addCase(saveFileThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const projectEntry = Object.entries(state.byProjectId).find(([, rec]) =>
          Boolean(rec.files[updated.id]),
        );
        if (!projectEntry) return;
        const [, record] = projectEntry;
        const file = record.files[updated.id];
        if (!file) return;
        record.files[updated.id] = {
          ...file,
          content: updated.content ?? file.content,
          draftContent: updated.content ?? file.draftContent,
          dirty: false,
          saving: false,
          saveError: null,
          filename: updated.filename ?? file.filename,
          file_type: updated.file_type ?? file.file_type,
          updated_at: updated.updated_at ?? file.updated_at,
        };
      })
      .addCase(saveFileThunk.rejected, (state, action) => {
        const fileId = action.meta.arg.fileId;
        const projectEntry = Object.entries(state.byProjectId).find(([, rec]) =>
          Boolean(rec.files[fileId]),
        );
        if (!projectEntry) return;
        const [, record] = projectEntry;
        const file = record.files[fileId];
        if (!file) return;
        record.files[fileId] = {
          ...file,
          saving: false,
          saveError: action.payload ?? "Failed to save file.",
        };
      })
      .addCase(deleteFileThunk.fulfilled, (state, action) => {
        const { projectId, fileId } = action.payload;
        const record = ensureRecord(state, projectId);
        if (!record.files[fileId]) return;
        const nextFiles = { ...record.files };
        delete nextFiles[fileId];
        const nextOpenIds = record.openFileIds.filter((id) => id !== fileId);
        let nextActiveId = record.activeFileId;
        if (record.activeFileId === fileId) {
          nextActiveId =
            nextOpenIds[nextOpenIds.length - 1] ??
            (Object.keys(nextFiles).length ? Number(Object.keys(nextFiles)[0]) : null);
        }
        record.files = nextFiles;
        record.openFileIds = nextOpenIds;
        record.activeFileId = nextActiveId;
      });
  },
});

export const {
  clearFilesForProject,
  openFile,
  closeFile,
  setActiveFile,
  updateFileDraft,
  markFileSaving,
  markFileSaved,
  setFileError,
  addFile,
  removeFile,
  syncFileContent,
} = filesSlice.actions;
export default filesSlice.reducer;

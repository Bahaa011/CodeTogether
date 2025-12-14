/**
 * File GraphQL API helpers for listing, creating, updating, and deleting project files.
 */
import { apolloClient } from "./client";
import { formatGraphQLError } from "./error";
import {
  CREATE_FILE_MUTATION,
  DELETE_FILE_MUTATION,
  GET_FILES_BY_PROJECT,
  UPDATE_FILE_MUTATION,
} from "./file.queries";

export type ProjectFile = {
  id: number;
  filename: string;
  file_type: string;
  content: string;
  updated_at: string;
  created_at?: string;
  project_id?: number | null;
  uploader_id?: number | null;
};

type GqlProjectFile = {
  id: number;
  filename?: string | null;
  file_type?: string | null;
  content?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  project_id?: number | null;
  uploader_id?: number | null;
};

type CreateFilePayload = {
  filename: string;
  file_type: string;
  content?: string;
  projectId: number;
  uploaderId: number;
};

type UpdateFilePayload = Partial<{
  filename: string;
  file_type: string;
  content: string;
}>;

const mapFile = (file?: GqlProjectFile | null): ProjectFile => {
  if (!file) {
    throw new Error("File payload missing.");
  }
  return {
    id: file.id,
    filename: file.filename ?? "",
    file_type: file.file_type ?? "",
    content: file.content ?? "",
    updated_at: file.updated_at ?? "",
    created_at: file.created_at ?? undefined,
    project_id: file.project_id ?? null,
    uploader_id: file.uploader_id ?? null,
  };
};

/** Fetches all files for a project. */
export async function fetchProjectFiles(projectId: number): Promise<ProjectFile[]> {
  try {
    const numericId = Number(projectId);
    const { data } = await apolloClient.query<{
      filesByProject?: GqlProjectFile[];
    }>({
      query: GET_FILES_BY_PROJECT,
      variables: { projectId: numericId },
      fetchPolicy: "network-only",
    });
    return (data?.filesByProject ?? []).map((file) => mapFile(file));
  } catch (error) {
    throw formatGraphQLError("Fetch project files", error);
  }
}

/** Creates a new file in a project and returns the created record. */
export async function createProjectFile(
  payload: CreateFilePayload,
): Promise<ProjectFile> {
  try {
    const { data } = await apolloClient.mutate<{ createFile?: GqlProjectFile }>({
      mutation: CREATE_FILE_MUTATION,
      variables: {
        input: {
          ...payload,
          projectId: Number(payload.projectId),
          uploaderId: Number(payload.uploaderId),
        },
      },
    });
    const created = data?.createFile;
    if (!created) throw new Error("Unable to create file.");
    return mapFile(created);
  } catch (error) {
    throw formatGraphQLError("Create file", error);
  }
}

/** Updates a file's metadata/content. */
export async function updateProjectFile(
  fileId: number,
  payload: UpdateFilePayload,
): Promise<ProjectFile> {
  try {
    const numericId = Number(fileId);
    const { data } = await apolloClient.mutate<{ updateFile?: GqlProjectFile }>({
      mutation: UPDATE_FILE_MUTATION,
      variables: { id: numericId, input: payload },
    });
    const updated = data?.updateFile;
    if (!updated) throw new Error("Unable to update file.");
    return mapFile(updated);
  } catch (error) {
    throw formatGraphQLError("Update file", error);
  }
}

/** Deletes a project file. */
export async function deleteProjectFile(fileId: number): Promise<boolean> {
  try {
    const numericId = Number(fileId);
    const { data } = await apolloClient.mutate<{ deleteFile?: boolean }>({
      mutation: DELETE_FILE_MUTATION,
      variables: { id: numericId },
    });
    return Boolean(data?.deleteFile);
  } catch (error) {
    throw formatGraphQLError("Delete file", error);
  }
}

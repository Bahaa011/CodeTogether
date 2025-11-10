/**
 * File API Service
 * ----------------
 * Manages all file-related operations for projects,
 * including creation, updating, retrieval, and deletion.
 */

import { apiClient, buildAxiosError } from "./apiClient";

/**
 * ProjectFile
 * ------------
 * Represents a single file within a project.
 */
export type ProjectFile = {
  id: number;
  filename: string;
  file_type: string;
  content: string;
  updated_at: string;
};

/**
 * fetchProjectFiles
 * ------------------
 * Retrieves all files associated with a specific project.
 */
export async function fetchProjectFiles(projectId: number) {
  try {
    const { data } = await apiClient.get<ProjectFile[]>(
      `/files/project/${projectId}`,
    );
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch project files", error);
  }
}

/**
 * updateProjectFile
 * ------------------
 * Updates the filename or content of an existing file.
 */
export async function updateProjectFile(
  fileId: number,
  payload: Partial<Pick<ProjectFile, "filename" | "content">>,
): Promise<ProjectFile> {
  try {
    const { data } = await apiClient.put<{ file: ProjectFile }>(
      `/files/${fileId}`,
      payload,
    );
    return data.file;
  } catch (error) {
    throw buildAxiosError("Update file", error);
  }
}

/**
 * CreateFilePayload
 * ------------------
 * Defines the structure for creating a new project file.
 */
type CreateFilePayload = {
  filename: string;
  file_type: string;
  content: string;
  projectId: number;
  uploaderId: number;
};

/**
 * createProjectFile
 * ------------------
 * Creates a new file within a specified project.
 */
export async function createProjectFile(payload: CreateFilePayload) {
  try {
    const { data } = await apiClient.post<ProjectFile>("/files", payload);
    return data;
  } catch (error) {
    throw buildAxiosError("Create file", error);
  }
}

/**
 * deleteProjectFile
 * ------------------
 * Deletes a file from a project by its file ID.
 */
export async function deleteProjectFile(fileId: number) {
  try {
    await apiClient.delete(`/files/${fileId}`);
  } catch (error) {
    throw buildAxiosError("Delete file", error);
  }
}

import { apiClient, buildAxiosError } from "./apiClient";

export type ProjectFile = {
  id: number;
  filename: string;
  file_type: string;
  content: string;
  updated_at: string;
};

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

type CreateFilePayload = {
  filename: string;
  file_type: string;
  content: string;
  projectId: number;
  uploaderId: number;
};

export async function createProjectFile(payload: CreateFilePayload) {
  try {
    const { data } = await apiClient.post<ProjectFile>("/files", payload);
    return data;
  } catch (error) {
    throw buildAxiosError("Create file", error);
  }
}

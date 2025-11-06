import { apiClient, buildAxiosError } from "./apiClient";

export type CreateVersionInput = {
  fileId: number;
  content: string;
  userId?: number | null;
  sessionId?: number | null;
};

export type BackupUser = {
  id?: number | null;
  username?: string | null;
  email?: string | null;
};

export type VersionRecord = {
  id: number;
  file: { id: number };
  version_number: number;
  content: string;
  created_at: string;
  user?: BackupUser | null;
};

export async function createVersionBackup(input: CreateVersionInput) {
  try {
    const response = await apiClient.post<VersionRecord>("/versions", {
      file_id: input.fileId,
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      content: input.content,
    });
    return response.data;
  } catch (error) {
    throw buildAxiosError("Create backup", error);
  }
}

export async function fetchFileBackups(fileId: number) {
  try {
    const response = await apiClient.get<VersionRecord[]>(`/versions/file/${fileId}`);
    return response.data;
  } catch (error) {
    throw buildAxiosError("Fetch backups", error);
  }
}

export async function fetchBackupById(id: number) {
  try {
    const response = await apiClient.get<VersionRecord>(`/versions/${id}`);
    return response.data;
  } catch (error) {
    throw buildAxiosError("Fetch backup", error);
  }
}

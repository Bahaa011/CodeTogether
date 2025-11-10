/**
 * Version API Service
 * --------------------
 * Manages version control for project files, including creation of backups,
 * retrieval of file version history, and restoring older versions.
 */

import { apiClient, buildAxiosError } from "./apiClient";

/**
 * CreateVersionInput
 * -------------------
 * Defines the payload used to create a new version (backup) of a file.
 */
export type CreateVersionInput = {
  fileId: number;
  content: string;
  userId?: number | null;
  sessionId?: number | null;
  label?: string | null;
};

/**
 * BackupUser
 * ------------
 * Represents the user associated with a specific version backup.
 */
export type BackupUser = {
  id?: number | null;
  username?: string | null;
  email?: string | null;
};

/**
 * VersionRecord
 * ---------------
 * Represents a single backup version entry of a file.
 */
export type VersionRecord = {
  id: number;
  file: { id: number };
  version_number: number;
  content: string;
  created_at: string;
  user?: BackupUser | null;
  label?: string | null;
};

/**
 * FileRecord
 * ------------
 * Represents a file entity when interacting with version restoration.
 */
export type FileRecord = {
  id: number;
  filename: string;
  file_type: string;
  content: string;
  project?: { id: number };
  updated_at?: string;
};

/**
 * createVersionBackup
 * --------------------
 * Creates a new backup (version) record for a file’s content.
 */
export async function createVersionBackup(input: CreateVersionInput) {
  try {
    const response = await apiClient.post<VersionRecord>("/versions", {
      file_id: input.fileId,
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      content: input.content,
      label: input.label ?? null,
    });
    return response.data;
  } catch (error) {
    throw buildAxiosError("Create backup", error);
  }
}

/**
 * revertVersionBackup
 * --------------------
 * Reverts a file’s content to a previous version based on version ID.
 */
export async function revertVersionBackup(versionId: number) {
  try {
    const response = await apiClient.post<FileRecord>(`/versions/${versionId}/revert`);
    return response.data;
  } catch (error) {
    throw buildAxiosError("Revert backup", error);
  }
}

/**
 * fetchFileBackups
 * -----------------
 * Retrieves all backup versions associated with a specific file.
 */
export async function fetchFileBackups(fileId: number) {
  try {
    const response = await apiClient.get<VersionRecord[]>(`/versions/file/${fileId}`);
    return response.data;
  } catch (error) {
    throw buildAxiosError("Fetch backups", error);
  }
}

/**
 * fetchBackupById
 * ----------------
 * Retrieves a single backup record by its unique version ID.
 */
export async function fetchBackupById(id: number) {
  try {
    const response = await apiClient.get<VersionRecord>(`/versions/${id}`);
    return response.data;
  } catch (error) {
    throw buildAxiosError("Fetch backup", error);
  }
}

/**
 * Version GraphQL API helpers for creating backups, listing, fetching, and reverting versions.
 */
import { apolloClient } from "./client";
import { formatGraphQLError } from "./error";
import {
  CREATE_VERSION_MUTATION,
  GET_VERSION,
  GET_VERSIONS_BY_FILE,
  REVERT_VERSION_MUTATION,
} from "./version.queries";

export type CreateVersionInput = {
  fileId: number;
  content: string;
  userId?: number | null;
  sessionId?: number | null;
  label?: string | null;
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
  label?: string | null;
};

export type FileRecord = {
  id: number;
  filename: string;
  file_type: string;
  content: string;
  updated_at?: string | null;
};

type GqlVersion = {
  id: number;
  version_number?: number | null;
  content?: string | null;
  label?: string | null;
  created_at?: string | null;
  file?: { id: number } | null;
  user?: BackupUser | null;
};

type GqlFileRecord = {
  id: number;
  filename?: string | null;
  file_type?: string | null;
  content?: string | null;
  updated_at?: string | null;
};

const mapVersion = (version?: GqlVersion | null): VersionRecord => {
  if (!version) throw new Error("Version payload missing.");
  return {
    id: version.id,
    version_number: version.version_number ?? 0,
    content: version.content ?? "",
    label: version.label ?? null,
    created_at: version.created_at ?? "",
    file: { id: version.file?.id ?? 0 },
    user: version.user ?? null,
  };
};

const mapFileRecord = (file?: GqlFileRecord | null): FileRecord => {
  if (!file) throw new Error("File payload missing.");
  return {
    id: file.id,
    filename: file.filename ?? "",
    file_type: file.file_type ?? "",
    content: file.content ?? "",
    updated_at: file.updated_at ?? null,
  };
};

/** Creates a version backup for a file. */
export async function createVersionBackup(input: CreateVersionInput) {
  try {
    const numericUserId =
      input.userId === undefined || input.userId === null
        ? undefined
        : Number(input.userId);
    const numericSessionId =
      input.sessionId === undefined || input.sessionId === null
        ? undefined
        : Number(input.sessionId);
    const { data } = await apolloClient.mutate<{ createVersion?: GqlVersion }>({
      mutation: CREATE_VERSION_MUTATION,
      variables: {
        input: {
          fileId: Number(input.fileId),
          content: input.content,
          userId: numericUserId,
          sessionId: numericSessionId,
          label: input.label ?? null,
        },
      },
    });
    const created = data?.createVersion;
    if (!created) throw new Error("Unable to create backup.");
    return mapVersion(created);
  } catch (error) {
    throw formatGraphQLError("Create backup", error);
  }
}

/** Fetches all backups for a file id. */
export async function fetchFileBackups(fileId: number) {
  try {
    const numericId = Number(fileId);
    const { data } = await apolloClient.query<{
      versionsByFile?: GqlVersion[];
    }>({
      query: GET_VERSIONS_BY_FILE,
      variables: { fileId: numericId },
      fetchPolicy: "network-only",
    });
    return (data?.versionsByFile ?? []).map((version) => mapVersion(version));
  } catch (error) {
    throw formatGraphQLError("Fetch backups", error);
  }
}

/** Fetches a single backup by id. */
export async function fetchBackupById(id: number) {
  try {
    const numericId = Number(id);
    const { data } = await apolloClient.query<{ version?: GqlVersion }>({
      query: GET_VERSION,
      variables: { id: numericId },
      fetchPolicy: "network-only",
    });
    const version = data?.version;
    if (!version) throw new Error("Backup not found.");
    return mapVersion(version);
  } catch (error) {
    throw formatGraphQLError("Fetch backup", error);
  }
}

/** Reverts a file to the specified backup version. */
export async function revertVersionBackup(versionId: number) {
  try {
    const numericId = Number(versionId);
    const { data } = await apolloClient.mutate<{
      revertVersion?: GqlFileRecord;
    }>({
      mutation: REVERT_VERSION_MUTATION,
      variables: { id: numericId },
    });
    const file = data?.revertVersion;
    if (!file) throw new Error("Unable to revert backup.");
    return mapFileRecord(file);
  } catch (error) {
    throw formatGraphQLError("Revert backup", error);
  }
}

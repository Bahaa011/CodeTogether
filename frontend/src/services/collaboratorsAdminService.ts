import { apiClient, buildAxiosError } from "./apiClient";

export type CollaboratorRecord = {
  id: number;
  role?: string | null;
  user?: {
    id: number;
    username?: string | null;
    email?: string | null;
  };
};

export async function fetchCollaboratorsByProject(projectId: number) {
  try {
    const { data } = await apiClient.get<CollaboratorRecord[]>(
      `/collaborators/project/${projectId}`,
    );
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch collaborators", error);
  }
}

export async function removeCollaborator(collaboratorId: number) {
  try {
    await apiClient.delete(`/collaborators/${collaboratorId}`);
  } catch (error) {
    throw buildAxiosError("Remove collaborator", error);
  }
}

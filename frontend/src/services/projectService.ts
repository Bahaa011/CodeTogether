import { apiClient, buildAxiosError } from "./apiClient";

export type ProjectCollaborator = {
  id: number;
  role?: string;
  user?: {
    id: number;
    username?: string;
    email?: string;
  };
};

export type ProjectTag = {
  id: number;
  tag: string;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  owner?: {
    id: number;
    username?: string;
    email?: string;
  };
  ownerId?: number;
  created_at?: string;
  updated_at?: string;
  collaborators?: ProjectCollaborator[];
  tags?: ProjectTag[];
};

export async function fetchProjectCount(ownerId: number) {
  try {
    const { data } = await apiClient.get<{ owner_id: number; count: number }>(
      `/projects/owner/${ownerId}/count`,
    );
    return data.count;
  } catch (error) {
    throw buildAxiosError("Project count", error);
  }
}

export async function fetchProjectsByOwner(ownerId: number) {
  try {
    const { data } = await apiClient.get<Project[]>(`/projects/owner/${ownerId}`);
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch projects", error);
  }
}

export async function fetchProjects() {
  try {
    const { data } = await apiClient.get<Project[]>("/projects/public");
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch projects", error);
  }
}

type CreateProjectPayload = {
  title: string;
  description: string;
  owner_id: number;
  is_public?: boolean;
};

export async function createProject(payload: CreateProjectPayload) {
  try {
    const { data } = await apiClient.post<Project>("/projects", payload);
    return data;
  } catch (error) {
    throw buildAxiosError("Create project", error);
  }
}

export async function fetchProjectById(projectId: number) {
  try {
    const { data } = await apiClient.get<Project>(`/projects/${projectId}`);
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch project", error);
  }
}

type UpdateProjectPayload = Partial<{
  title: string;
  description: string;
  is_public: boolean;
}>;

export async function updateProject(projectId: number, payload: UpdateProjectPayload) {
  try {
    const { data } = await apiClient.put<{ project: Project }>(
      `/projects/${projectId}`,
      payload,
    );
    return data.project;
  } catch (error) {
    throw buildAxiosError("Update project", error);
  }
}

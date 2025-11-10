/**
 * Project API Service
 * -------------------
 * Provides all frontend operations for managing projects,
 * including creation, retrieval, updating, deletion, and tag handling.
 */

import axios from "axios";
import { apiClient, buildAxiosError } from "./apiClient";

/**
 * ProjectCollaborator
 * --------------------
 * Represents a collaborator on a specific project.
 */
export type ProjectCollaborator = {
  id: number;
  role?: string;
  user?: {
    id: number;
    username?: string;
    email?: string;
    avatar_url?: string | null;
  };
};

/**
 * ProjectTag
 * -----------
 * Represents a tag attached to a project for categorization.
 */
export type ProjectTag = {
  id: number;
  tag: string;
};

/**
 * Project
 * --------
 * Defines the structure of a project entity.
 */
export type Project = {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  owner?: {
    id: number;
    username?: string;
    email?: string;
    avatar_url?: string | null;
  };
  ownerId?: number;
  created_at?: string;
  updated_at?: string;
  collaborators?: ProjectCollaborator[];
  tags?: ProjectTag[];
};

/**
 * fetchProjectCount
 * ------------------
 * Retrieves the number of projects owned by a specific user.
 */
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

/**
 * fetchProjectsByOwner
 * ---------------------
 * Retrieves all projects created by a specific user.
 */
export async function fetchProjectsByOwner(ownerId: number) {
  try {
    const { data } = await apiClient.get<Project[]>(`/projects/owner/${ownerId}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw buildAxiosError("Fetch projects", error);
  }
}

/**
 * fetchProjects
 * --------------
 * Retrieves all publicly available projects.
 */
export async function fetchProjects() {
  try {
    const { data } = await apiClient.get<Project[]>("/projects/public");
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch projects", error);
  }
}

/**
 * CreateProjectPayload
 * ---------------------
 * Defines the structure used to create a new project.
 */
type CreateProjectPayload = {
  title: string;
  description: string;
  owner_id: number;
  is_public?: boolean;
  tags?: string[];
};

/**
 * createProject
 * --------------
 * Creates a new project owned by a specific user.
 */
export async function createProject(payload: CreateProjectPayload) {
  try {
    const { data } = await apiClient.post<Project>("/projects", payload);
    return data;
  } catch (error) {
    throw buildAxiosError("Create project", error);
  }
}

/**
 * fetchProjectById
 * -----------------
 * Retrieves detailed information about a project by its ID.
 */
export async function fetchProjectById(projectId: number) {
  try {
    const { data } = await apiClient.get<Project>(`/projects/${projectId}`);
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch project", error);
  }
}

/**
 * UpdateProjectPayload
 * ---------------------
 * Defines fields that can be updated in an existing project.
 */
type UpdateProjectPayload = Partial<{
  title: string;
  description: string;
  is_public: boolean;
  tags: string[];
}>;

/**
 * updateProject
 * --------------
 * Updates project information such as title, description, visibility, or tags.
 */
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

/**
 * deleteProject
 * --------------
 * Deletes a project permanently by its project ID.
 */
export async function deleteProject(projectId: number) {
  try {
    await apiClient.delete(`/projects/${projectId}`);
  } catch (error) {
    throw buildAxiosError("Delete project", error);
  }
}

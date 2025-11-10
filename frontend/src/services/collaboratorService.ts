/**
 * Collaborator API Service
 * ------------------------
 * Provides frontend methods for managing project collaborators,
 * including invitations, role management, and collaboration lookups.
 */

import axios from "axios";
import { apiClient, buildAxiosError } from "./apiClient";
import type { Project } from "./projectService";

/**
 * fetchCollaborationCount
 * ------------------------
 * Retrieves the number of collaborations associated with a given user.
 */
export async function fetchCollaborationCount(userId: number) {
  try {
    const { data } = await apiClient.get<{ user_id: number; count: number }>(
      `/collaborators/user/${userId}/count`,
    );
    return data.count;
  } catch (error) {
    throw buildAxiosError("Collaboration count", error);
  }
}

/**
 * InviteCollaboratorPayload
 * --------------------------
 * Defines the payload used when inviting a collaborator to a project.
 */
type InviteCollaboratorPayload = {
  inviterId: number;
  projectId: number;
  inviteeIdentifier: string;
};

/**
 * inviteCollaborator
 * -------------------
 * Sends an invitation to a user to collaborate on a specified project.
 */
export async function inviteCollaborator(payload: InviteCollaboratorPayload) {
  try {
    const { data } = await apiClient.post<{ message: string }>(
      "/collaborators/invite",
      payload,
    );
    return data;
  } catch (error) {
    throw buildAxiosError("Invite collaborator", error);
  }
}

/**
 * RespondCollaboratorInvitePayload
 * ---------------------------------
 * Defines the payload for accepting or declining a collaboration invite.
 */
type RespondCollaboratorInvitePayload = {
  userId: number;
  accept: boolean;
};

/**
 * respondToCollaboratorInvite
 * ----------------------------
 * Allows a user to accept or decline a collaborator invitation.
 */
export async function respondToCollaboratorInvite(
  notificationId: number,
  payload: RespondCollaboratorInvitePayload,
) {
  try {
    const { data } = await apiClient.post<{ message: string; accepted: boolean }>(
      `/collaborators/invite/${notificationId}/respond`,
      payload,
    );
    return data;
  } catch (error) {
    throw buildAxiosError("Respond to collaborator invite", error);
  }
}

/**
 * UserCollaboration
 * ------------------
 * Represents a collaboration record linking a user to a project.
 */
export type UserCollaboration = {
  id: number;
  role?: string;
  added_at?: string;
  project?: Project;
};

/**
 * fetchCollaborationsByUser
 * --------------------------
 * Retrieves all projects where the specified user is a collaborator.
 */
export async function fetchCollaborationsByUser(userId: number) {
  try {
    const { data } = await apiClient.get<UserCollaboration[]>(
      `/collaborators/user/${userId}`,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw buildAxiosError("Fetch collaborations", error);
  }
}

/**
 * CollaboratorRecord
 * -------------------
 * Defines a collaborator record within a specific project.
 */
export type CollaboratorRecord = {
  id: number;
  role?: string | null;
  user?: {
    id: number;
    username?: string | null;
    email?: string | null;
  };
};

/**
 * fetchCollaboratorsByProject
 * ----------------------------
 * Retrieves all collaborators associated with a given project.
 */
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

/**
 * removeCollaborator
 * -------------------
 * Removes a collaborator from a project by their collaborator ID.
 */
export async function removeCollaborator(collaboratorId: number) {
  try {
    await apiClient.delete(`/collaborators/${collaboratorId}`);
  } catch (error) {
    throw buildAxiosError("Remove collaborator", error);
  }
}

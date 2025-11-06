import axios from "axios";
import { apiClient, buildAxiosError } from "./apiClient";
import type { Project } from "./projectService";

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

type InviteCollaboratorPayload = {
  inviterId: number;
  projectId: number;
  inviteeIdentifier: string;
};

export async function inviteCollaborator(
  payload: InviteCollaboratorPayload,
) {
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

type RespondCollaboratorInvitePayload = {
  userId: number;
  accept: boolean;
};

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

export type UserCollaboration = {
  id: number;
  role?: string;
  added_at?: string;
  project?: Project;
};

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

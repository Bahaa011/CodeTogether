import { apolloClient } from "./client";
import { formatGraphQLError } from "./error";
import {
  GET_COLLABORATORS_BY_PROJECT,
  GET_COLLABORATIONS_BY_USER,
  GET_COLLABORATION_COUNT,
  INVITE_COLLABORATOR_MUTATION,
  REMOVE_COLLABORATOR_MUTATION,
  RESPOND_TO_COLLABORATOR_INVITE_MUTATION,
} from "./collaborator.queries";
import type { Project } from "./project.api";

type GqlCollaboratorProjectTag = {
  id: number;
  tag: string;
};

type GqlCollaboratorUser = {
  id: string | number;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type GqlCollaboratorProject = {
  id: string | number;
  title?: string | null;
  description?: string | null;
  is_public?: boolean | null;
  updated_at?: string | null;
  owner_id?: number | null;
  owner?: GqlCollaboratorUser | null;
  tags?: GqlCollaboratorProjectTag[] | null;
};

type GqlCollaborator = {
  id: number;
  role?: string | null;
  added_at?: string | null;
  user?: GqlCollaboratorUser | null;
  project?: GqlCollaboratorProject | null;
};

export type CollaboratorRecord = {
  id: number;
  role?: string | null;
  user?: {
    id: number;
    username?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
};

export type UserCollaboration = {
  id: number;
  role?: string | null;
  added_at?: string | null;
  project?: Project;
};

type InviteCollaboratorPayload = {
  inviterId: number;
  projectId: number;
  inviteeIdentifier: string;
};

type RespondCollaboratorInvitePayload = {
  userId: number;
  accept: boolean;
};

const mapUser = (user?: GqlCollaboratorUser | null) => {
  if (!user) return undefined;
  return {
    id: Number(user.id),
    username: user.username ?? undefined,
    email: user.email ?? undefined,
    avatar_url: user.avatar_url ?? null,
  };
};

const mapProject = (project?: GqlCollaboratorProject | null): Project | undefined => {
  if (!project) return undefined;
  return {
    id: Number(project.id),
    title: project.title ?? "",
    description: project.description ?? "",
    is_public: Boolean(project.is_public),
    updated_at: project.updated_at ?? undefined,
    ownerId:
      project.owner_id ??
      (project.owner ? Number(project.owner.id) : undefined),
    owner: mapUser(project.owner),
    tags:
      project.tags?.map((tag) =>
        tag
          ? {
              id: tag.id,
              tag: tag.tag,
            }
          : null,
      ).filter((tag): tag is { id: number; tag: string } => Boolean(tag)) ?? [],
  };
};

const mapCollaboratorRecord = (collab: GqlCollaborator): CollaboratorRecord => ({
  id: collab.id,
  role: collab.role ?? undefined,
  user: mapUser(collab.user),
});

const mapUserCollaboration = (collab: GqlCollaborator): UserCollaboration => ({
  id: collab.id,
  role: collab.role ?? undefined,
  added_at: collab.added_at ?? undefined,
  project: mapProject(collab.project),
});

export async function fetchCollaboratorsByProject(projectId: number) {
  try {
    const numericId = Number(projectId);
    const { data } = await apolloClient.query<{
      collaboratorsByProject?: GqlCollaborator[];
    }>({
      query: GET_COLLABORATORS_BY_PROJECT,
      variables: { projectId: numericId },
      fetchPolicy: "network-only",
    });
    return (data?.collaboratorsByProject ?? []).map(mapCollaboratorRecord);
  } catch (error) {
    throw formatGraphQLError("Fetch collaborators", error);
  }
}

export async function fetchCollaborationsByUser(userId: number) {
  try {
    const numericId = Number(userId);
    const { data } = await apolloClient.query<{
      collaboratorsByUser?: GqlCollaborator[];
    }>({
      query: GET_COLLABORATIONS_BY_USER,
      variables: { userId: numericId },
      fetchPolicy: "network-only",
    });
    return (data?.collaboratorsByUser ?? []).map(mapUserCollaboration);
  } catch (error) {
    throw formatGraphQLError("Fetch collaborations", error);
  }
}

export async function fetchCollaborationCount(userId: number) {
  try {
    const numericId = Number(userId);
    const { data } = await apolloClient.query<{
      collaborationCountByUser?: number;
    }>({
      query: GET_COLLABORATION_COUNT,
      variables: { userId: numericId },
      fetchPolicy: "network-only",
    });
    return data?.collaborationCountByUser ?? 0;
  } catch (error) {
    throw formatGraphQLError("Collaboration count", error);
  }
}

export async function inviteCollaborator(payload: InviteCollaboratorPayload) {
  try {
    const variables = {
      input: {
        ...payload,
        inviterId: Number(payload.inviterId),
        projectId: Number(payload.projectId),
      },
    };
    const { data } = await apolloClient.mutate<{
      inviteCollaborator?: { message: string };
    }>({
      mutation: INVITE_COLLABORATOR_MUTATION,
      variables,
    });
    const response = data?.inviteCollaborator;
    if (!response) throw new Error("Unable to send invitation.");
    return response;
  } catch (error) {
    throw formatGraphQLError("Invite collaborator", error);
  }
}

export async function respondToCollaboratorInvite(
  notificationId: number,
  payload: RespondCollaboratorInvitePayload,
) {
  try {
    const variables = {
      notificationId: Number(notificationId),
      input: {
        ...payload,
        userId: Number(payload.userId),
      },
    };
    const { data } = await apolloClient.mutate<{
      respondToCollaboratorInvite?: { message: string; accepted?: boolean };
    }>({
      mutation: RESPOND_TO_COLLABORATOR_INVITE_MUTATION,
      variables,
    });
    const response = data?.respondToCollaboratorInvite;
    if (!response) throw new Error("Unable to respond to invitation.");
    return response;
  } catch (error) {
    throw formatGraphQLError("Respond to collaborator invite", error);
  }
}

export async function removeCollaborator(collaboratorId: number) {
  try {
    const numericId = Number(collaboratorId);
    const { data } = await apolloClient.mutate<{
      removeCollaborator?: boolean;
    }>({
      mutation: REMOVE_COLLABORATOR_MUTATION,
      variables: { id: numericId },
    });
    return Boolean(data?.removeCollaborator);
  } catch (error) {
    throw formatGraphQLError("Remove collaborator", error);
  }
}

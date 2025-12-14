/**
 * Project GraphQL API helpers for loading, tagging, creating, updating, and deleting projects.
 */
import { apolloClient } from "./client";
import { formatGraphQLError } from "./error";
import {
  CREATE_PROJECT_MUTATION,
  DELETE_PROJECT_MUTATION,
  GET_PROJECT,
  GET_PROJECTS_BY_OWNER,
  GET_PROJECT_COUNT_BY_OWNER,
  GET_PUBLIC_PROJECTS,
  GET_PROJECT_TAGS,
  GET_PROJECT_TAGS_BY_PROJECT,
  CREATE_PROJECT_TAG_MUTATION,
  UPDATE_PROJECT_TAG_MUTATION,
  DELETE_PROJECT_TAG_MUTATION,
  UPDATE_PROJECT_MUTATION,
} from "./project.queries";

type GqlProjectUser = {
  id: string | number;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type GqlProjectTag = {
  id: number;
  tag?: string | null;
  project_id?: number | null;
};

type GqlProjectCollaborator = {
  id: number;
  role?: string | null;
  user?: GqlProjectUser | null;
  inviteIdentifier?: string | null;
  invite_identifier?: string | null;
  inviteEmail?: string | null;
  invite_email?: string | null;
};

type GqlProject = {
  id: number;
  title?: string | null;
  description?: string | null;
  is_public?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  owner_id?: number | null;
  owner?: GqlProjectUser | null;
  tags?: (GqlProjectTag | null)[] | null;
  collaborators?: (GqlProjectCollaborator | null)[] | null;
};

export type ProjectCollaborator = {
  id: number;
  role?: string | null;
  user?: {
    id: number;
    username?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
  inviteIdentifier?: string | null;
  inviteEmail?: string | null;
};

export type ProjectTag = {
  id: number;
  tag: string;
  project_id?: number;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  owner?: {
    id: number;
    username?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
  ownerId?: number;
  created_at?: string;
  updated_at?: string;
  collaborators?: ProjectCollaborator[];
  tags?: ProjectTag[];
};

type CreateProjectPayload = {
  title: string;
  description: string;
  owner_id: number;
  is_public?: boolean;
  tags?: string[];
};

type UpdateProjectPayload = Partial<{
  title: string;
  description: string;
  is_public: boolean;
  tags: string[];
}>;

const mapUser = (user?: GqlProjectUser | null) => {
  if (!user) return undefined;
  return {
    id: Number(user.id),
    username: user.username ?? undefined,
    email: user.email ?? undefined,
    avatar_url: user.avatar_url ?? null,
  };
};

const mapTag = (tag?: GqlProjectTag | null): ProjectTag | null => {
  if (!tag) return null;
  return {
    id: tag.id,
    tag: tag.tag ?? "",
    project_id: tag.project_id ?? undefined,
  };
};

const mapCollaborator = (
  collaborator?: GqlProjectCollaborator | null,
): ProjectCollaborator | null => {
  if (!collaborator) return null;
  return {
    id: collaborator.id,
    role: collaborator.role ?? undefined,
    user: mapUser(collaborator.user),
    inviteIdentifier:
      collaborator.inviteIdentifier ??
      collaborator.invite_identifier ??
      collaborator.inviteEmail ??
      collaborator.invite_email ??
      undefined,
    inviteEmail:
      collaborator.inviteEmail ??
      collaborator.invite_email ??
      collaborator.inviteIdentifier ??
      collaborator.invite_identifier ??
      undefined,
  };
};

const mapProject = (project?: GqlProject | null): Project => {
  if (!project) {
    throw new Error("Project payload missing.");
  }
  return {
    id: project.id,
    title: project.title ?? "",
    description: project.description ?? "",
    is_public: Boolean(project.is_public),
    ownerId:
      project.owner_id ??
      (project.owner ? Number(project.owner.id) : undefined),
    owner: mapUser(project.owner),
    created_at: project.created_at ?? undefined,
    updated_at: project.updated_at ?? undefined,
    collaborators:
      project.collaborators
        ?.map((collaborator) => mapCollaborator(collaborator))
        .filter(
          (value): value is Exclude<typeof value, null> => Boolean(value),
        ) ?? [],
    tags:
      project.tags
        ?.map((tag) => mapTag(tag))
        .filter((value): value is Exclude<typeof value, null> => Boolean(value)) ??
      [],
  };
};

/** Fetches all available project tags. */
export async function fetchProjectTags(): Promise<ProjectTag[]> {
  try {
    const { data } = await apolloClient.query<{ projectTags?: GqlProjectTag[] }>(
      {
        query: GET_PROJECT_TAGS,
        fetchPolicy: "network-only",
      },
    );
    return (data?.projectTags ?? [])
      .map((tag) => mapTag(tag))
      .filter((tag): tag is ProjectTag => Boolean(tag));
  } catch (error) {
    throw formatGraphQLError("Fetch project tags", error);
  }
}

/** Fetches tags associated with a project. */
export async function fetchProjectTagsByProject(
  projectId: number,
): Promise<ProjectTag[]> {
  try {
    const { data } = await apolloClient.query<{
      projectTagsByProject?: GqlProjectTag[];
    }>({
      query: GET_PROJECT_TAGS_BY_PROJECT,
      variables: { projectId: Number(projectId) },
      fetchPolicy: "network-only",
    });
    return (data?.projectTagsByProject ?? [])
      .map((tag) => mapTag(tag))
      .filter((tag): tag is ProjectTag => Boolean(tag));
  } catch (error) {
    throw formatGraphQLError("Fetch project tags", error);
  }
}

/** Creates a new tag for a project. */
export async function createProjectTag(input: {
  tag: string;
  projectId: number;
}): Promise<ProjectTag> {
  try {
    const { data } = await apolloClient.mutate<{ createProjectTag?: GqlProjectTag }>(
      {
        mutation: CREATE_PROJECT_TAG_MUTATION,
        variables: {
          input: {
            tag: input.tag,
            projectId: Number(input.projectId),
          },
        },
      },
    );
    const created = data?.createProjectTag;
    if (!created) throw new Error("Unable to create project tag.");
    const mapped = mapTag(created);
    if (!mapped) throw new Error("Project tag payload missing.");
    return mapped;
  } catch (error) {
    throw formatGraphQLError("Create project tag", error);
  }
}

/** Updates a project's tag value. */
export async function updateProjectTag(id: number, tag: string): Promise<ProjectTag> {
  try {
    const { data } = await apolloClient.mutate<{ updateProjectTag?: GqlProjectTag }>(
      {
        mutation: UPDATE_PROJECT_TAG_MUTATION,
        variables: { id: Number(id), input: { tag } },
      },
    );
    const updated = data?.updateProjectTag;
    if (!updated) throw new Error("Unable to update project tag.");
    const mapped = mapTag(updated);
    if (!mapped) throw new Error("Project tag payload missing.");
    return mapped;
  } catch (error) {
    throw formatGraphQLError("Update project tag", error);
  }
}

/** Deletes a tag by id. */
export async function deleteProjectTag(id: number): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<{ deleteProjectTag?: boolean }>(
      {
        mutation: DELETE_PROJECT_TAG_MUTATION,
        variables: { id: Number(id) },
      },
    );
    return Boolean(data?.deleteProjectTag);
  } catch (error) {
    throw formatGraphQLError("Delete project tag", error);
  }
}

/** Fetches public projects for discovery. */
export async function fetchProjects(): Promise<Project[]> {
  try {
    const { data } = await apolloClient.query<{
      publicProjects?: GqlProject[];
    }>({
      query: GET_PUBLIC_PROJECTS,
      fetchPolicy: "network-only",
    });
    return (data?.publicProjects ?? []).map((project) => mapProject(project));
  } catch (error) {
    throw formatGraphQLError("Fetch projects", error);
  }
}

/** Fetches projects owned by a user. */
export async function fetchProjectsByOwner(ownerId: number): Promise<Project[]> {
  try {
    const numericId = Number(ownerId);
    const { data } = await apolloClient.query<{
      projectsByOwner?: GqlProject[];
    }>({
      query: GET_PROJECTS_BY_OWNER,
      variables: { ownerId: numericId },
      fetchPolicy: "network-only",
    });
    return (data?.projectsByOwner ?? []).map((project) => mapProject(project));
  } catch (error) {
    throw formatGraphQLError("Fetch owned projects", error);
  }
}

/** Fetches a project by id. */
export async function fetchProjectById(projectId: number): Promise<Project> {
  try {
    const numericId = Number(projectId);
    const { data } = await apolloClient.query<{
      project?: GqlProject | null;
    }>({
      query: GET_PROJECT,
      variables: { id: numericId },
      fetchPolicy: "network-only",
    });
    const payload = data?.project;
    if (!payload) throw new Error("Project not found.");
    return mapProject(payload);
  } catch (error) {
    throw formatGraphQLError("Fetch project", error);
  }
}

/** Returns the total number of projects for an owner. */
export async function fetchProjectCount(ownerId: number): Promise<number> {
  try {
    const numericId = Number(ownerId);
    const { data } = await apolloClient.query<{
      projectCountByOwner?: number;
    }>({
      query: GET_PROJECT_COUNT_BY_OWNER,
      variables: { ownerId: numericId },
      fetchPolicy: "network-only",
    });
    return data?.projectCountByOwner ?? 0;
  } catch (error) {
    throw formatGraphQLError("Project count", error);
  }
}

/** Creates a new project owned by a user. */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  try {
    const numericOwnerId = Number(payload.owner_id);
    const { data } = await apolloClient.mutate<{ createProject?: GqlProject }>({
      mutation: CREATE_PROJECT_MUTATION,
      variables: {
        input: {
          ...payload,
          owner_id: numericOwnerId,
        },
      },
    });
    const created = data?.createProject;
    if (!created) throw new Error("Unable to create project.");
    return mapProject(created);
  } catch (error) {
    throw formatGraphQLError("Create project", error);
  }
}

/** Updates project metadata and tags. */
export async function updateProject(
  projectId: number,
  payload: UpdateProjectPayload,
): Promise<Project> {
  try {
    const numericId = Number(projectId);
    const { data } = await apolloClient.mutate<{ updateProject?: GqlProject }>({
      mutation: UPDATE_PROJECT_MUTATION,
      variables: { id: numericId, input: payload },
    });
    const updated = data?.updateProject;
    if (!updated) throw new Error("Unable to update project.");
    return mapProject(updated);
  } catch (error) {
    throw formatGraphQLError("Update project", error);
  }
}

/** Deletes a project. */
export async function deleteProject(projectId: number): Promise<boolean> {
  try {
    const numericId = Number(projectId);
    const { data } = await apolloClient.mutate<{ deleteProject?: boolean }>({
      mutation: DELETE_PROJECT_MUTATION,
      variables: { id: numericId },
    });
    return Boolean(data?.deleteProject);
  } catch (error) {
    throw formatGraphQLError("Delete project", error);
  }
}

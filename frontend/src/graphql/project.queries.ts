/**
 * Project GraphQL fragments and operations for projects and tags.
 */
import { gql } from "@apollo/client";
import { USER_FIELDS } from "./user.queries";

export const PROJECT_TAG_FIELDS = gql`
  fragment ProjectTagFields on ProjectTagModel {
    id
    tag
    project_id
  }
`;

export const PROJECT_COLLABORATOR_USER_FIELDS = gql`
  fragment ProjectCollaboratorUserFields on ProjectCollaboratorUser {
    id
    username
    email
    avatar_url
  }
`;

export const PROJECT_COLLABORATOR_FIELDS = gql`
  fragment ProjectCollaboratorFields on ProjectCollaboratorInfo {
    id
    role
    user {
      ...ProjectCollaboratorUserFields
    }
  }
  ${PROJECT_COLLABORATOR_USER_FIELDS}
`;

export const PROJECT_FIELDS = gql`
  fragment ProjectFields on ProjectModel {
    id
    title
    description
    created_at
    updated_at
    is_public
    owner_id
    owner {
      ...UserFields
    }
    tags {
      ...ProjectTagFields
    }
    collaborators {
      ...ProjectCollaboratorFields
    }
  }
  ${USER_FIELDS}
  ${PROJECT_TAG_FIELDS}
  ${PROJECT_COLLABORATOR_FIELDS}
`;

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      ...ProjectFields
    }
  }
  ${PROJECT_FIELDS}
`;

export const GET_PUBLIC_PROJECTS = gql`
  query GetPublicProjects {
    publicProjects {
      ...ProjectFields
    }
  }
  ${PROJECT_FIELDS}
`;

export const GET_PROJECTS_BY_OWNER = gql`
  query GetProjectsByOwner($ownerId: Int!) {
    projectsByOwner(ownerId: $ownerId) {
      ...ProjectFields
    }
  }
  ${PROJECT_FIELDS}
`;

export const GET_PROJECT = gql`
  query GetProject($id: Int!) {
    project(id: $id) {
      ...ProjectFields
    }
  }
  ${PROJECT_FIELDS}
`;

export const GET_PROJECT_COUNT_BY_OWNER = gql`
  query GetProjectCountByOwner($ownerId: Int!) {
    projectCountByOwner(ownerId: $ownerId)
  }
`;

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      ...ProjectFields
    }
  }
  ${PROJECT_FIELDS}
`;

export const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject($id: Int!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      ...ProjectFields
    }
  }
  ${PROJECT_FIELDS}
`;

export const DELETE_PROJECT_MUTATION = gql`
  mutation DeleteProject($id: Int!) {
    deleteProject(id: $id)
  }
`;

export const GET_PROJECT_TAGS = gql`
  query GetProjectTags {
    projectTags {
      ...ProjectTagFields
    }
  }
  ${PROJECT_TAG_FIELDS}
`;

export const GET_PROJECT_TAGS_BY_PROJECT = gql`
  query GetProjectTagsByProject($projectId: Int!) {
    projectTagsByProject(projectId: $projectId) {
      ...ProjectTagFields
    }
  }
  ${PROJECT_TAG_FIELDS}
`;

export const CREATE_PROJECT_TAG_MUTATION = gql`
  mutation CreateProjectTag($input: CreateProjectTagInput!) {
    createProjectTag(input: $input) {
      ...ProjectTagFields
    }
  }
  ${PROJECT_TAG_FIELDS}
`;

export const UPDATE_PROJECT_TAG_MUTATION = gql`
  mutation UpdateProjectTag($id: Int!, $input: UpdateProjectTagInput!) {
    updateProjectTag(id: $id, input: $input) {
      ...ProjectTagFields
    }
  }
  ${PROJECT_TAG_FIELDS}
`;

export const DELETE_PROJECT_TAG_MUTATION = gql`
  mutation DeleteProjectTag($id: Int!) {
    deleteProjectTag(id: $id)
  }
`;

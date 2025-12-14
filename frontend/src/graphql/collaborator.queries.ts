/**
 * Collaborator-related GraphQL fragments and operations.
 */
import { gql } from "@apollo/client";

export const COLLABORATOR_USER_FIELDS = gql`
  fragment CollaboratorUserFields on CollaboratorUserInfo {
    id
    username
    email
    avatar_url
  }
`;

export const COLLABORATOR_PROJECT_TAG_FIELDS = gql`
  fragment CollaboratorProjectTagFields on CollaboratorProjectTag {
    id
    tag
  }
`;

export const COLLABORATOR_PROJECT_FIELDS = gql`
  fragment CollaboratorProjectFields on CollaboratorProjectInfo {
    id
    title
    description
    is_public
    updated_at
    owner_id
    owner {
      ...CollaboratorUserFields
    }
    tags {
      ...CollaboratorProjectTagFields
    }
  }
  ${COLLABORATOR_USER_FIELDS}
  ${COLLABORATOR_PROJECT_TAG_FIELDS}
`;

export const COLLABORATOR_FIELDS = gql`
  fragment CollaboratorFields on Collaborator {
    id
    role
    added_at
    user {
      ...CollaboratorUserFields
    }
    project {
      ...CollaboratorProjectFields
    }
  }
  ${COLLABORATOR_USER_FIELDS}
  ${COLLABORATOR_PROJECT_FIELDS}
`;

export const GET_COLLABORATORS_BY_PROJECT = gql`
  query CollaboratorsByProject($projectId: Int!) {
    collaboratorsByProject(projectId: $projectId) {
      ...CollaboratorFields
    }
  }
  ${COLLABORATOR_FIELDS}
`;

export const GET_COLLABORATIONS_BY_USER = gql`
  query CollaboratorsByUser($userId: Int!) {
    collaboratorsByUser(userId: $userId) {
      ...CollaboratorFields
    }
  }
  ${COLLABORATOR_FIELDS}
`;

export const GET_COLLABORATION_COUNT = gql`
  query CollaborationCountByUser($userId: Int!) {
    collaborationCountByUser(userId: $userId)
  }
`;

export const INVITE_COLLABORATOR_MUTATION = gql`
  mutation InviteCollaborator($input: InviteCollaboratorInput!) {
    inviteCollaborator(input: $input) {
      message
    }
  }
`;

export const RESPOND_TO_COLLABORATOR_INVITE_MUTATION = gql`
  mutation RespondToCollaboratorInvite(
    $notificationId: Int!
    $input: RespondCollaboratorInviteInput!
  ) {
    respondToCollaboratorInvite(
      notificationId: $notificationId
      input: $input
    ) {
      message
      accepted
    }
  }
`;

export const REMOVE_COLLABORATOR_MUTATION = gql`
  mutation RemoveCollaborator($id: Int!) {
    removeCollaborator(id: $id)
  }
`;

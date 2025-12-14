import { gql } from "@apollo/client";

export const SESSION_USER_FIELDS = gql`
  fragment SessionUserFields on SessionUserInfo {
    id
    username
    email
    avatar_url
  }
`;

export const SESSION_FIELDS = gql`
  fragment SessionFields on ProjectSessionModel {
    id
    status
    started_at
    ended_at
    last_activity
    user {
      ...SessionUserFields
    }
  }
  ${SESSION_USER_FIELDS}
`;

export const GET_ACTIVE_SESSIONS_BY_PROJECT = gql`
  query ActiveSessionsByProject($projectId: Int!) {
    activeSessionsByProject(projectId: $projectId) {
      ...SessionFields
    }
  }
  ${SESSION_FIELDS}
`;

export const GET_LONG_SESSION_COUNT_BY_USER = gql`
  query LongSessionCountByUser($userId: Int!) {
    longSessionCountByUser(userId: $userId)
  }
`;

export const CREATE_SESSION_MUTATION = gql`
  mutation StartSession($input: CreateSessionInput!) {
    startSession(input: $input) {
      ...SessionFields
    }
  }
  ${SESSION_FIELDS}
`;

export const END_SESSION_MUTATION = gql`
  mutation EndSession($sessionId: Int!) {
    endSession(sessionId: $sessionId)
  }
`;

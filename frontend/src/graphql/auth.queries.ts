import { gql } from "@apollo/client";
import { USER_FIELDS } from "./user.queries";

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      __typename
      ... on AuthSession {
        access_token
        user {
          ...UserFields
        }
      }
      ... on MfaChallenge {
        requires_mfa
        mfaToken
        message
      }
    }
  }
  ${USER_FIELDS}
`;

export const VERIFY_MFA_MUTATION = gql`
  mutation VerifyMfa($input: VerifyMfaInput!) {
    verifyMfa(input: $input) {
      access_token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const PROFILE_QUERY = gql`
  query AuthProfile {
    authProfile {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const TOGGLE_MFA_MUTATION = gql`
  mutation ToggleMfa($input: ToggleMfaInput!) {
    toggleMfa(input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      message
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      message
    }
  }
`;

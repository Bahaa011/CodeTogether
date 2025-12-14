import { gql } from "@apollo/client";

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    username
    email
    avatar_url
    bio
    created_at
    mfa_enabled
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const GET_USER = gql`
  query GetUser($id: Int!) {
    user(id: $id) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserDto!) {
    registerUser(input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($id: Int!, $input: UpdateUserProfileDto!) {
    updateUserProfile(id: $id, input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const UPLOAD_USER_AVATAR = gql`
  mutation UploadUserAvatar($userId: Int!, $file: Upload!) {
    uploadUserAvatar(userId: $userId, file: $file) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

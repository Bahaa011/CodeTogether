/**
 * Version GraphQL operations for backups and version retrieval.
 */
import { gql } from "@apollo/client";

export const VERSION_USER_FIELDS = gql`
  fragment VersionUserFields on VersionUserInfo {
    id
    username
    email
  }
`;

export const VERSION_FILE_FIELDS = gql`
  fragment VersionFileFields on VersionFileInfo {
    id
    filename
    file_type
  }
`;

export const VERSION_FIELDS = gql`
  fragment VersionFields on VersionModel {
    id
    version_number
    content
    label
    created_at
    file {
      ...VersionFileFields
    }
    user {
      ...VersionUserFields
    }
  }
  ${VERSION_FILE_FIELDS}
  ${VERSION_USER_FIELDS}
`;

export const GET_VERSIONS_BY_FILE = gql`
  query VersionsByFile($fileId: Int!) {
    versionsByFile(fileId: $fileId) {
      ...VersionFields
    }
  }
  ${VERSION_FIELDS}
`;

export const GET_VERSION = gql`
  query Version($id: Int!) {
    version(id: $id) {
      ...VersionFields
    }
  }
  ${VERSION_FIELDS}
`;

export const CREATE_VERSION_MUTATION = gql`
  mutation CreateVersion($input: CreateVersionInput!) {
    createVersion(input: $input) {
      ...VersionFields
    }
  }
  ${VERSION_FIELDS}
`;

export const REVERT_VERSION_MUTATION = gql`
  mutation RevertVersion($id: Int!) {
    revertVersion(id: $id) {
      id
      filename
      file_type
      content
      updated_at
    }
  }
`;

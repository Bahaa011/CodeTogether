/**
 * File-related GraphQL fragments and operations.
 */
import { gql } from "@apollo/client";

export const FILE_UPLOADER_FIELDS = gql`
  fragment FileUploaderFields on FileUserInfo {
    id
    username
    email
    avatar_url
  }
`;

export const FILE_FIELDS = gql`
  fragment FileFields on ProjectFileModel {
    id
    filename
    file_type
    content
    created_at
    updated_at
    project_id
    uploader_id
    uploader {
      ...FileUploaderFields
    }
  }
  ${FILE_UPLOADER_FIELDS}
`;

export const GET_FILES_BY_PROJECT = gql`
  query GetFilesByProject($projectId: Int!) {
    filesByProject(projectId: $projectId) {
      ...FileFields
    }
  }
  ${FILE_FIELDS}
`;

export const GET_FILE = gql`
  query GetFile($id: Int!) {
    file(id: $id) {
      ...FileFields
    }
  }
  ${FILE_FIELDS}
`;

export const CREATE_FILE_MUTATION = gql`
  mutation CreateFile($input: CreateFileInput!) {
    createFile(input: $input) {
      ...FileFields
    }
  }
  ${FILE_FIELDS}
`;

export const UPDATE_FILE_MUTATION = gql`
  mutation UpdateFile($id: Int!, $input: UpdateFileInput!) {
    updateFile(id: $id, input: $input) {
      ...FileFields
    }
  }
  ${FILE_FIELDS}
`;

export const DELETE_FILE_MUTATION = gql`
  mutation DeleteFile($id: Int!) {
    deleteFile(id: $id)
  }
`;

import { gql } from "@apollo/client";

export const NOTIFICATION_FIELDS = gql`
  fragment NotificationFields on NotificationModel {
    id
    message
    type
    metadata
    is_read
    created_at
    updated_at
    read_at
  }
`;

export const GET_NOTIFICATIONS_BY_USER = gql`
  query GetNotificationsByUser($userId: Int!) {
    notificationsByUser(userId: $userId) {
      ...NotificationFields
    }
  }
  ${NOTIFICATION_FIELDS}
`;

export const UPDATE_NOTIFICATION_STATUS = gql`
  mutation UpdateNotificationStatus(
    $id: Int!
    $input: UpdateNotificationStatusInput!
  ) {
    updateNotificationStatus(id: $id, input: $input) {
      ...NotificationFields
    }
  }
  ${NOTIFICATION_FIELDS}
`;

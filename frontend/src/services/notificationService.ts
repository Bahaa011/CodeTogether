/**
 * Notification API Service
 * ------------------------
 * Handles all notification-related frontend API operations,
 * including retrieval and read-status updates for user notifications.
 */

import { apiClient, buildAxiosError } from "./apiClient";

/**
 * NotificationMetadata
 * ---------------------
 * Represents metadata for notifications, such as collaboration invites.
 */
export type NotificationMetadata = {
  projectId?: number;
  projectTitle?: string;
  inviterId?: number;
  inviterName?: string;
  inviteeId?: number;
  status?: "pending" | "accepted" | "declined";
  respondedAt?: string;
  [key: string]: unknown;
};

/**
 * Notification
 * -------------
 * Represents a user notification record.
 */
export type Notification = {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  read_at: string | null;
  metadata?: NotificationMetadata | null;
};

/**
 * fetchNotificationsForUser
 * --------------------------
 * Retrieves all notifications belonging to a specific user.
 */
export async function fetchNotificationsForUser(userId: number) {
  try {
    const { data } = await apiClient.get<Notification[]>(
      `/notifications/user/${userId}`,
    );
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch notifications", error);
  }
}

/**
 * markNotificationRead
 * ---------------------
 * Updates the read status of a notification.
 */
export async function markNotificationRead(
  notificationId: number,
  isRead: boolean,
) {
  try {
    const { data } = await apiClient.put<Notification>(
      `/notifications/${notificationId}`,
      { is_read: isRead },
    );
    return data;
  } catch (error) {
    throw buildAxiosError("Update notification", error);
  }
}

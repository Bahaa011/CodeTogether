/**
 * User API Service
 * ----------------
 * Manages all frontend API operations related to users,
 * including fetching profiles, updating information, and uploading avatars.
 */

import axios from "axios";
import { apiClient, buildAxiosError } from "./apiClient";
import type { StoredUser } from "../utils/auth";

/**
 * UserSummary
 * ------------
 * Represents a lightweight version of a user record,
 * used for listings or collaborator summaries.
 */
export type UserSummary = {
  id: number;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

/**
 * fetchUsers
 * -----------
 * Retrieves all users from the system.
 */
export async function fetchUsers() {
  try {
    const { data } = await apiClient.get<UserSummary[]>("/users");
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch users", error);
  }
}

/**
 * UserProfile
 * ------------
 * Represents a complete user profile including bio and creation date.
 */
export type UserProfile = StoredUser & {
  bio?: string | null;
  created_at?: string;
};

/**
 * fetchUserById
 * --------------
 * Retrieves a specific user profile by ID.
 * Returns null if the user does not exist.
 */
export async function fetchUserById(userId: number) {
  try {
    const { data } = await apiClient.get<UserProfile>(`/users/${userId}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw buildAxiosError("Fetch user", error);
  }
}

/**
 * updateUserProfile
 * ------------------
 * Updates a user’s profile information such as bio or avatar URL.
 */
export async function updateUserProfile(
  userId: number,
  updates: { avatar_url?: string | null; bio?: string },
) {
  try {
    const { data } = await apiClient.put<{ user: StoredUser }>(
      `/users/${userId}`,
      updates,
    );
    return data.user;
  } catch (error) {
    throw buildAxiosError("Update profile", error);
  }
}

/**
 * uploadUserAvatar
 * -----------------
 * Uploads a new avatar image for the specified user.
 * Accepts a file object and returns the updated user record.
 */
export async function uploadUserAvatar(userId: number, file: File) {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const { data } = await apiClient.post<{ user: StoredUser }>(
      `/users/${userId}/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data.user;
  } catch (error) {
    throw buildAxiosError("Avatar upload", error);
  }
}

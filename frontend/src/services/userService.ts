import axios from "axios";
import { apiClient, buildAxiosError } from "./apiClient";
import type { StoredUser } from "../utils/auth";

export type UserSummary = {
  id: number;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

export async function fetchUsers() {
  try {
    const { data } = await apiClient.get<UserSummary[]>("/users");
    return data;
  } catch (error) {
    throw buildAxiosError("Fetch users", error);
  }
}

export type UserProfile = StoredUser & {
  bio?: string | null;
  created_at?: string;
};

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

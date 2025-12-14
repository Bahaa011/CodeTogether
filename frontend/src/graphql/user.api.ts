import { apolloClient } from "./client";
import { formatGraphQLError } from "./error";
import {
  GET_USER,
  GET_USERS,
  REGISTER_USER,
  UPDATE_USER_PROFILE,
  UPLOAD_USER_AVATAR,
} from "./user.queries";
import { normalizeStoredUser, type StoredUser } from "../utils/auth";

export type UserProfile = StoredUser;

export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const response = await apolloClient.query<{ users: UserProfile[] }>({
      query: GET_USERS,
      fetchPolicy: "network-only",
    });
    const users = response.data?.users ?? [];
    return users.map((user) => normalizeStoredUser(user));
  } catch (error) {
    throw formatGraphQLError("Fetch users", error);
  }
}

export async function fetchUserById(
  userId: number,
): Promise<UserProfile | null> {
  try {
    const response = await apolloClient.query<{ user: UserProfile | null }>({
      query: GET_USER,
      variables: { id: userId },
      fetchPolicy: "network-only",
    });
    const user = response.data?.user;
    return user ? normalizeStoredUser(user) : null;
  } catch (error) {
    throw formatGraphQLError("Fetch user", error);
  }
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
) {
  try {
    const response = await apolloClient.mutate<{ registerUser: UserProfile | null }>(
      {
        mutation: REGISTER_USER,
        variables: { input: { username, email, password } },
      },
    );
    const user = response.data?.registerUser;
    return user ? normalizeStoredUser(user) : null;
  } catch (error) {
    throw formatGraphQLError("Registration", error);
  }
}

export async function updateUserProfile(
  userId: number,
  updates: { avatar_url?: string | null; bio?: string },
): Promise<StoredUser> {
  try {
    const numericId = Number(userId);
    const response = await apolloClient.mutate<{ updateUserProfile: StoredUser }>(
      {
        mutation: UPDATE_USER_PROFILE,
        variables: { id: numericId, input: updates },
      },
    );
    const payload = response.data?.updateUserProfile;
    if (!payload) throw new Error("No user returned from update.");
    return normalizeStoredUser(payload);
  } catch (error) {
    throw formatGraphQLError("Update profile", error);
  }
}

export async function uploadUserAvatar(userId: number, file: File) {
  try {
    const { data } = await apolloClient.mutate<{
      uploadUserAvatar?: StoredUser;
    }>({
      mutation: UPLOAD_USER_AVATAR,
      variables: { userId: Number(userId), file },
    });
    const user = data?.uploadUserAvatar;
    if (!user) throw new Error("Unable to upload avatar.");
    return normalizeStoredUser(user);
  } catch (error) {
    throw formatGraphQLError(
      "Avatar upload",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * User slice handles authentication flows, user cache, and current user state/errors.
 */
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { apolloClient } from "../graphql/client";
import { GET_USER, GET_USERS } from "../graphql/user.queries";
import {
  registerUser as registerUserMutation,
  updateUserProfile as updateUserProfileMutation,
  uploadUserAvatar as uploadUserAvatarMutation,
} from "../graphql/user.api";
import {
  fetchProfile,
  loginUser,
  requestPasswordReset,
  resetPassword,
  toggleMfa,
  verifyMfaLogin,
  type LoginResponse,
  type LoginSuccessResponse,
} from "../graphql/auth.api";
import {
  setStoredUser,
  setToken,
  setRole,
  type StoredUser,
} from "../utils/auth";

export type UserRecord = StoredUser;

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export type UsersState = {
  list: UserRecord[];
  byId: Record<number, UserRecord>;
  listStatus: AsyncStatus;
  listError: string | null;
  profileStatus: Record<number, AsyncStatus>;
  profileError: Record<number, string | null>;
  currentUserId: number | null;
  currentUserStatus: AsyncStatus;
  currentUserError: string | null;
};

const initialState: UsersState = {
  list: [],
  byId: {},
  listStatus: "idle",
  listError: null,
  profileStatus: {},
  profileError: {},
  currentUserId: null,
  currentUserStatus: "idle",
  currentUserError: null,
};

const normalizeUsers = (users: UserRecord[]) => {
  const byId: Record<number, UserRecord> = {};
  for (const user of users) {
    byId[user.id] = user;
  }
  return byId;
};

const upsertCollection = (state: UsersState, user: UserRecord) => {
  state.byId[user.id] = user;
  const index = state.list.findIndex((item) => item.id === user.id);
  if (index === -1) {
    state.list.push(user);
  } else {
    state.list[index] = user;
  }
};

/**
 * Fetches full user list for admin views and caches list/byId.
 */
export const fetchUsers = createAsyncThunk<
  UserRecord[],
  void,
  { rejectValue: string }
>("users/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await apolloClient.query<{ users: UserRecord[] }>({
      query: GET_USERS,
      fetchPolicy: "network-only",
    });
    return response.data?.users ?? [];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load users.";
    return rejectWithValue(message);
  }
});

/**
 * Loads a single user by id for profile/detail pages.
 */
export const fetchUserById = createAsyncThunk<
  UserRecord,
  number,
  { rejectValue: string }
>("users/fetchById", async (userId, { rejectWithValue }) => {
  try {
    const response = await apolloClient.query<{ user: UserRecord }>({
      query: GET_USER,
      variables: { id: userId },
      fetchPolicy: "network-only",
    });
    const user = response.data?.user;
    if (!user) {
      throw new Error("User not found.");
    }
    return user;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load user.";
    return rejectWithValue(message);
  }
});

/**
 * Refreshes the authenticated user's profile and persists it locally.
 */
export const refreshCurrentUser = createAsyncThunk<
  StoredUser,
  void,
  { rejectValue: string }
>("users/refreshCurrent", async (_, { rejectWithValue }) => {
  try {
    const profile = await fetchProfile();
    setStoredUser(profile);
    return profile;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load profile.";
    return rejectWithValue(message);
  }
});

/**
 * Signs in a user with email/password, storing token and user on success.
 */
export const authenticateUser = createAsyncThunk<
  LoginResponse,
  { email: string; password: string },
  { rejectValue: string }
>("users/authenticate", async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await loginUser(email, password);
    if ("access_token" in response) {
      setToken(response.access_token);
      setStoredUser(response.user);
      setRole((response.user as { role?: string }).role || null);
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in right now.";
    return rejectWithValue(message);
  }
});

/**
 * Confirms an MFA code and refreshes auth token/user.
 */
export const verifyMfaCode = createAsyncThunk<
  LoginSuccessResponse,
  { token: string; code: string },
  { rejectValue: string }
>("users/verifyMfa", async ({ token, code }, { rejectWithValue }) => {
  try {
    const response = await verifyMfaLogin(token, code);
    setToken(response.access_token);
    setStoredUser(response.user);
    setRole((response.user as { role?: string }).role || null);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify MFA code.";
    return rejectWithValue(message);
  }
});

/**
 * Sends password reset email for the given account.
 */
export const requestPasswordResetThunk = createAsyncThunk<
  string,
  { email: string },
  { rejectValue: string }
>("users/requestPasswordReset", async ({ email }, { rejectWithValue }) => {
  try {
    return await requestPasswordReset(email);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process password reset right now.";
    return rejectWithValue(message);
  }
});

/**
 * Completes password reset using token and new password.
 */
export const resetPasswordThunk = createAsyncThunk<
  string,
  { token: string; password: string },
  { rejectValue: string }
>("users/resetPassword", async ({ token, password }, { rejectWithValue }) => {
  try {
    return await resetPassword(token, password);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to reset password right now.";
    return rejectWithValue(message);
  }
});

/**
 * Registers a new user account with username/email/password.
 */
export const registerUserThunk = createAsyncThunk<
  StoredUser | null,
  { username: string; email: string; password: string },
  { rejectValue: string }
>("users/register", async ({ username, email, password }, { rejectWithValue }) => {
  try {
    return await registerUserMutation(username, email, password);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign up right now.";
    return rejectWithValue(message);
  }
});

/**
 * Saves profile updates and refreshes stored user when applicable.
 */
export const saveUserProfile = createAsyncThunk<
  StoredUser,
  { userId: number; updates: { avatar_url?: string | null; bio?: string } },
  { rejectValue: string }
>("users/saveProfile", async ({ userId, updates }, { rejectWithValue }) => {
  try {
    const updated = await updateUserProfileMutation(userId, updates);
    if (updated.id === userId) setStoredUser(updated);
    return updated;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update profile.";
    return rejectWithValue(message);
  }
});

/**
 * Uploads avatar media and returns updated user.
 */
export const uploadAvatar = createAsyncThunk<
  StoredUser,
  { userId: number; file: File },
  { rejectValue: string }
>("users/uploadAvatar", async ({ userId, file }, { rejectWithValue }) => {
  try {
    const updated = await uploadUserAvatarMutation(userId, file);
    if (updated.id === userId) setStoredUser(updated);
    return updated;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload avatar.";
    return rejectWithValue(message);
  }
});

/**
 * Enables/disables MFA for the current user and refreshes cache.
 */
export const toggleUserMfa = createAsyncThunk<
  StoredUser,
  { enabled: boolean },
  { rejectValue: string }
>("users/toggleMfa", async ({ enabled }, { rejectWithValue }) => {
  try {
    const updated = await toggleMfa(enabled);
    setStoredUser(updated);
    return updated;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update MFA.";
    return rejectWithValue(message);
  }
});

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    // Inserts or updates a user in list/byId caches.
    upsertUser(state, action: PayloadAction<UserRecord>) {
      upsertCollection(state, action.payload);
    },
    // Clears all user cache/state.
    clearUsers(state) {
      state.list = [];
      state.byId = {};
      state.listStatus = "idle";
      state.listError = null;
      state.profileStatus = {};
      state.profileError = {};
    },
    // Removes current user pointer and resets status/error.
    clearCurrentUser(state) {
      state.currentUserId = null;
      state.currentUserStatus = "idle";
      state.currentUserError = null;
    },
    // Sets current user pointer and caches the record.
    setCurrentUser(state, action: PayloadAction<UserRecord | null>) {
      const user = action.payload;
      if (!user) {
        state.currentUserId = null;
        state.currentUserStatus = "idle";
        state.currentUserError = null;
        return;
      }
      upsertCollection(state, user);
      state.currentUserId = user.id;
      state.currentUserStatus = "succeeded";
      state.currentUserError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.list = action.payload;
        state.byId = normalizeUsers(action.payload);
        state.listError = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload ?? "Unable to load users.";
      })
      .addCase(fetchUserById.pending, (state, action) => {
        const id = action.meta.arg;
        state.profileStatus[id] = "loading";
        state.profileError[id] = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        const user = action.payload;
        state.profileStatus[user.id] = "succeeded";
        state.profileError[user.id] = null;
        upsertCollection(state, user);
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        const id = action.meta.arg;
        state.profileStatus[id] = "failed";
        state.profileError[id] =
          action.payload ?? "Unable to load this user's profile.";
      })
      .addCase(refreshCurrentUser.pending, (state) => {
        state.currentUserStatus = "loading";
        state.currentUserError = null;
      })
      .addCase(refreshCurrentUser.fulfilled, (state, action) => {
        const user = action.payload;
        state.currentUserStatus = "succeeded";
        state.currentUserId = user.id;
        state.currentUserError = null;
        upsertCollection(state, user);
      })
      .addCase(refreshCurrentUser.rejected, (state, action) => {
        state.currentUserStatus = "failed";
        state.currentUserError =
          action.payload ?? "Unable to load your profile.";
        state.currentUserId = null;
      })
      .addCase(saveUserProfile.fulfilled, (state, action) => {
        const user = action.payload;
        upsertCollection(state, user);
        if (state.currentUserId === user.id) {
          state.currentUserStatus = "succeeded";
          state.currentUserError = null;
        }
      })
      .addCase(saveUserProfile.rejected, (state, action) => {
        if (action.meta.arg.userId) {
          state.profileError[action.meta.arg.userId] =
            action.payload ?? "Unable to update profile.";
        }
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        const user = action.payload;
        upsertCollection(state, user);
      })
      .addCase(toggleUserMfa.fulfilled, (state, action) => {
        const user = action.payload;
        upsertCollection(state, user);
        if (state.currentUserId === user.id) {
          state.currentUserStatus = "succeeded";
          state.currentUserError = null;
        }
      })
      .addCase(toggleUserMfa.rejected, (state, action) => {
        state.currentUserError =
          action.payload ?? "Unable to update MFA settings.";
      });
  },
});

export const {
  upsertUser,
  clearUsers,
  clearCurrentUser,
  setCurrentUser,
} = userSlice.actions;
export default userSlice.reducer;

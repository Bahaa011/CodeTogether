import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchNotificationsForUser,
  markNotificationRead,
  type Notification,
} from "../graphql/notification.api";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

type NotificationsState = {
  list: Notification[];
  status: AsyncStatus;
  error: string | null;
};

const initialState: NotificationsState = {
  list: [],
  status: "idle",
  error: null,
};

export const loadNotificationsForUser = createAsyncThunk<
  Notification[],
  number,
  { rejectValue: string }
>(
  "notifications/loadForUser",
  async (userId, { rejectWithValue }) => {
    try {
      return await fetchNotificationsForUser(userId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load notifications.";
      return rejectWithValue(message);
    }
  },
);

export const updateNotificationStatus = createAsyncThunk<
  Notification,
  { notificationId: number; isRead: boolean },
  { rejectValue: string }
>(
  "notifications/updateStatus",
  async ({ notificationId, isRead }, { rejectWithValue }) => {
    try {
      return await markNotificationRead(notificationId, isRead);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update notification.";
      return rejectWithValue(message);
    }
  },
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotifications(state) {
      state.list = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotificationsForUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadNotificationsForUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
        state.error = null;
      })
      .addCase(loadNotificationsForUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to load notifications.";
      })
      .addCase(updateNotificationStatus.fulfilled, (state, action) => {
        const index = state.list.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.list[index] = action.payload;
      })
      .addCase(updateNotificationStatus.rejected, (state, action) => {
        state.error = action.payload ?? state.error ?? "Unable to update notification.";
      });
  },
});

export const { clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;

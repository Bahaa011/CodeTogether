import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "./userSlice";
import portfolioReducer from "./portfolioSlice";
import projectsReducer from "./projectsSlice";
import notificationsReducer from "./notificationsSlice";
import collaboratorsReducer from "./collaboratorsSlice";
import sessionsReducer from "./sessionsSlice";
import backupsReducer from "./backupsSlice";
import filesReducer from "./filesSlice";
import versionReducer from "./versionSlice";
import themeReducer from "./themeSlice";

export const store = configureStore({
  reducer: {
    users: usersReducer,
    portfolio: portfolioReducer,
    projects: projectsReducer,
    notifications: notificationsReducer,
    collaborators: collaboratorsReducer,
    sessions: sessionsReducer,
    backups: backupsReducer,
    files: filesReducer,
    version: versionReducer,
    theme: themeReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

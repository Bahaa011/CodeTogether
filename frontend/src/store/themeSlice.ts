/**
 * Theme slice stores the current light/dark preference with helpers to toggle and persist it.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from ".";

export type Theme = "light" | "dark";

const STORAGE_KEY = "codetogether:theme";

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
};

type ThemeState = {
  value: Theme;
};

const initialState: ThemeState = {
  value: getPreferredTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    // Sets a specific theme value.
    setTheme(state, action: PayloadAction<Theme>) {
      state.value = action.payload;
    },
    // Toggles between light and dark.
    toggleTheme(state) {
      state.value = state.value === "dark" ? "light" : "dark";
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export const selectTheme = (state: RootState) => state.theme.value;
export { STORAGE_KEY, getPreferredTheme };
export default themeSlice.reducer;

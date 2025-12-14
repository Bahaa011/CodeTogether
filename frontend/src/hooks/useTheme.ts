import { useLayoutEffect, useMemo } from "react";
import {
  selectTheme,
  setTheme as setThemeAction,
  STORAGE_KEY,
  toggleTheme as toggleThemeAction,
  type Theme,
} from "../store/themeSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  if (document.body) {
    document.body.dataset.theme = theme;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
};

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  // Keep DOM attributes and storage synchronized with the Redux theme state
  useLayoutEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return useMemo(
    () => ({
      theme,
      setTheme: (value: Theme) => dispatch(setThemeAction(value)),
      toggleTheme: () => dispatch(toggleThemeAction()),
    }),
    [dispatch, theme],
  );
}

export function ThemeInitializer() {
  useTheme();
  return null;
}

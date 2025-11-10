/**
 * Theme Context and Provider
 * ---------------------------------------
 * Provides light/dark theme management across the application.
 * The theme is persisted in localStorage and synchronized with
 * the document’s dataset attributes to allow CSS theme switching.
 *
 * Includes a context-based API for accessing and toggling the theme
 * from any component within the provider tree.
 */

import {
  createContext,
  createElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

/** Theme variants supported by the UI */
export type Theme = "light" | "dark";

/** Context value containing the current theme and updater functions */
export type ThemeContextValue = {
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
  toggleTheme(): void;
};

const STORAGE_KEY = "codetogether:theme";

/**
 * Determines the preferred theme.
 * Returns stored preference if available,
 * otherwise detects system-level preference.
 */
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

/** Shared React context for theme state */
export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

/**
 * ThemeProvider
 * ---------------------------------------
 * Wraps the application and manages theme state.
 * Syncs the current theme with document attributes and localStorage.
 *
 * Responsibilities:
 * - Initialize theme based on user/system preference
 * - Persist selected theme to localStorage
 * - Update `data-theme` and `color-scheme` attributes in the DOM
 * - Expose `theme`, `setTheme`, and `toggleTheme` through context
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());

  // Apply theme to the document and persist it
  useLayoutEffect(() => {
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
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

/**
 * useTheme
 * ---------------------------------------
 * Accesses the current theme context.
 * Throws an error if called outside of ThemeProvider.
 *
 * Returned values:
 * - theme: The active theme ("light" or "dark")
 * - setTheme: Updates the current theme manually
 * - toggleTheme: Switches between light and dark
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

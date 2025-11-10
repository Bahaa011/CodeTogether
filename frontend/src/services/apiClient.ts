/**
 * apiClient
 * ----------
 * Centralized Axios configuration for backend communication.
 * Handles authentication headers and consistent error normalization.
 */

import axios from "axios";
import { getToken } from "../utils/auth";

/**
 * Base API URL (defaults to localhost if environment variable not found).
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Shared Axios instance with default JSON headers.
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor
 * -------------------
 * Automatically appends JWT Bearer token to requests when available.
 */
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * ErrorPayload
 * -------------
 * Defines the standard shape of API error responses.
 */
type ErrorPayload = {
  message?: string;
};

/**
 * buildAxiosError
 * ----------------
 * Converts raw Axios or network errors into standardized Error objects.
 */
export function buildAxiosError(context: string, error: unknown): Error {
  if (axios.isAxiosError<ErrorPayload>(error)) {
    const status = error.response?.status;
    const responseMessage =
      error.response?.data?.message ||
      error.response?.statusText ||
      error.message;

    return new Error(
      `${context} failed${status ? ` (${status})` : ""}: ${responseMessage}`,
    );
  }

  return error instanceof Error ? error : new Error(String(error));
}

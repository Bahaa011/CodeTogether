import axios from "axios";
import { getToken } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ErrorPayload = {
  message?: string;
};

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

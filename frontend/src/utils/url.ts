const API_BASE_URL =
  ((import.meta.env.VITE_API_URL as string | undefined) ??
    "http://localhost:3000")
    .trim()
    .replace(/\/$/, "");

export function resolveAssetUrl(path?: string | null): string {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

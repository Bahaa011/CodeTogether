/**
 * formatGraphQLError
 * ------------------
 * Normalizes GraphQL/Apollo errors into standard Error objects
 * while preserving the operation context for easier debugging.
 */
export function formatGraphQLError(context: string, error: unknown): Error {
  if (error instanceof Error) {
    return new Error(`${context} failed: ${error.message}`);
  }

  try {
    return new Error(`${context} failed: ${JSON.stringify(error)}`);
  } catch {
    return new Error(`${context} failed: ${String(error)}`);
  }
}

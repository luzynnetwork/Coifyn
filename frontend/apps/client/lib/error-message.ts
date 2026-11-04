import { ApiError } from "@coifyn/api-client";

/**
 * Human-readable text for a failed API call. Prefers the RFC7807 `detail`,
 * lists validation `errors` when present, and gives 403s a clear permission
 * message so the user knows why nothing happened.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return error.problem.detail ?? "You do not have permission to do that.";
    }
    if (error.problem.errors?.length) return error.problem.errors.join(", ");
    return error.problem.detail ?? error.problem.title;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

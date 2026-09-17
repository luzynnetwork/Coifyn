/**
 * Typed error for the RFC7807 `application/problem+json` shape returned by the
 * API (see backend/src/common/filters/problem-json.filter.ts).
 */

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  errors?: string[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.problem = problem;
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ProblemDetails>;
    return new ApiError({
      type: body.type ?? "about:blank",
      title: body.title ?? response.statusText,
      status: body.status ?? response.status,
      detail: body.detail,
      instance: body.instance,
      correlationId: body.correlationId,
      errors: body.errors,
    });
  } catch {
    return new ApiError({
      type: "about:blank",
      title: response.statusText || "Error",
      status: response.status,
    });
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  errors?: string[];
}

/**
 * Turns every exception into `application/problem+json` (RFC 7807). Registered
 * globally in main.ts, so controllers never format an error response and every
 * failure carries the request's correlation id.
 */
@Catch()
export class ProblemJsonFilter implements ExceptionFilter {
  private readonly logger = new Logger('Http');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();

    const problem = this.toProblem(exception);
    problem.instance = req.originalUrl;
    problem.correlationId =
      (req.id as string | undefined) ??
      (req.headers['x-correlation-id'] as string | undefined);

    if (problem.status >= 500) {
      this.logger.error(
        `${req.method} ${req.originalUrl} → ${problem.status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res
      .status(problem.status)
      .type('application/problem+json')
      .json(problem);
  }

  private toProblem(exception: unknown): Problem {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const title = statusText(status);

      if (typeof body === 'string') {
        return { type: 'about:blank', title, status, detail: body };
      }
      const record = body as Record<string, unknown>;
      const message = record.message;
      // ValidationPipe: message is a string[].
      if (Array.isArray(message)) {
        return {
          type: 'about:blank',
          title,
          status,
          detail: 'Request validation failed.',
          errors: message.map(String),
        };
      }
      return {
        type: 'about:blank',
        title,
        status,
        detail:
          typeof message === 'string' ? message : (record.error as string) ??
          title,
      };
    }

    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred.',
    };
  }
}

function statusText(status: number): string {
  const key = Object.entries(HttpStatus).find(
    ([, value]) => value === status,
  )?.[0];
  if (!key) return 'Error';
  return key
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

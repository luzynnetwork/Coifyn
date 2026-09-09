import {
  BadRequestException,
  ForbiddenException,
  type ArgumentsHost,
} from '@nestjs/common';
import { ProblemJsonFilter } from './problem-json.filter.js';

function hostFor(exception: unknown) {
  const captured: { status?: number; type?: string; body?: unknown } = {};
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    type(t: string) {
      captured.type = t;
      return this;
    },
    json(b: unknown) {
      captured.body = b;
      return this;
    },
  };
  const req = {
    method: 'POST',
    originalUrl: '/api/v1/roles',
    id: 'corr-1',
    headers: {},
  };
  const host = {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ArgumentsHost;
  new ProblemJsonFilter().catch(exception, host);
  return captured;
}

describe('ProblemJsonFilter', () => {
  it('maps an HttpException to problem+json with the correlation id', () => {
    const out = hostFor(new ForbiddenException('Missing permission: role:create'));
    expect(out.status).toBe(403);
    expect(out.type).toBe('application/problem+json');
    expect(out.body).toMatchObject({
      title: 'Forbidden',
      status: 403,
      detail: 'Missing permission: role:create',
      instance: '/api/v1/roles',
      correlationId: 'corr-1',
    });
  });

  it('flattens ValidationPipe messages into errors[]', () => {
    const out = hostFor(
      new BadRequestException(['name must be longer', 'grants must be an array']),
    );
    expect(out.status).toBe(400);
    expect((out.body as { errors: string[] }).errors).toEqual([
      'name must be longer',
      'grants must be an array',
    ]);
  });

  it('maps an unknown error to a 500 without leaking details', () => {
    const out = hostFor(new Error('db exploded'));
    expect(out.status).toBe(500);
    expect(out.body).toMatchObject({
      status: 500,
      detail: 'An unexpected error occurred.',
    });
    expect(JSON.stringify(out.body)).not.toContain('db exploded');
  });
});

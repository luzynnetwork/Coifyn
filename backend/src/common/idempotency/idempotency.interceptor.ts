import { createHash } from 'node:crypto';
import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import type { AuthUser } from '../../auth/auth-user.js';
import {
  IDEMPOTENCY_STORE,
  type IdempotencyStore,
} from './idempotency-store.js';

const REPLAYABLE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Honours the `Idempotency-Key` request header on write routes: a retried
 * request with the same key + method + path + caller replays the first
 * response (with `Idempotency-Replayed: true`); a retry while the first is still
 * running gets 409. Global — routes opt in by the caller sending the header,
 * which payment, sync and webhook clients must.
 *
 * Only successful (2xx) responses are stored; a failed handler releases the
 * claim so a genuine retry can proceed.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @Inject(IDEMPOTENCY_STORE) private readonly store: IdempotencyStore,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> | Promise<Observable<unknown>> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const res = context.switchToHttp().getResponse<Response>();

    const headerKey = req.headers['idempotency-key'];
    if (
      !REPLAYABLE_METHODS.has(req.method) ||
      typeof headerKey !== 'string' ||
      headerKey.length === 0
    ) {
      return next.handle();
    }

    const key = this.scopedKey(req, headerKey);

    return from(this.store.get(key)).pipe(
      switchMap((existing) => {
        if (existing?.kind === 'response') {
          res.status(existing.status);
          res.setHeader('Idempotency-Replayed', 'true');
          return of(existing.body);
        }
        if (existing?.kind === 'pending') {
          throw new ConflictException(
            'A request with this Idempotency-Key is already in progress.',
          );
        }
        return from(this.store.begin(key)).pipe(
          switchMap((claimed) => {
            if (!claimed) {
              throw new ConflictException(
                'A request with this Idempotency-Key is already in progress.',
              );
            }
            return next.handle().pipe(
              tap({
                next: (body) => {
                  const status = res.statusCode;
                  if (status >= 200 && status < 300) {
                    void this.store.finish(key, status, body ?? null);
                  } else {
                    void this.store.release(key);
                  }
                },
                error: () => void this.store.release(key),
              }),
            );
          }),
        );
      }),
    );
  }

  private scopedKey(req: Request & { user?: AuthUser }, headerKey: string): string {
    const actor = req.user?.id ?? 'anon';
    const path = req.baseUrl + req.path;
    return (
      'idem:' +
      createHash('sha256')
        .update(`${actor}\n${req.method}\n${path}\n${headerKey}`)
        .digest('hex')
    );
  }
}

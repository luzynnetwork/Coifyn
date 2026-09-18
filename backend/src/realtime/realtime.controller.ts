import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DatabaseService } from '../persistence/database.service.js';
import { branches } from '../persistence/schema/index.js';
import { Authorize } from '../rbac/application/authorize.js';
import { MembershipsRepo } from '../rbac/data/memberships.repo.js';
import {
  createHeartbeat,
  formatSseEvent,
  MAX_STREAM_DURATION_MS,
  SSE_HEADERS,
} from './sse-framing.js';
import { RealtimeBus } from './realtime-bus.js';

/**
 * Generic SSE stream: `GET /api/v1/realtime/stream?topic=<kind>:<id>`.
 * Supported topic kinds:
 *  - `salon:<salonId>`  — any membership in the salon is enough to subscribe.
 *  - `queue:<branchId>` / `branch:<branchId>` — resolves the branch's salon,
 *    then requires the `queue:view` permission scoped to that branch.
 */
@ApiTags('realtime')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'realtime', version: '1' })
export class RealtimeController {
  constructor(
    private readonly bus: RealtimeBus,
    private readonly database: DatabaseService,
    private readonly authorize: Authorize,
    private readonly memberships: MembershipsRepo,
  ) {}

  @Get('stream')
  async stream(
    @CurrentUser() user: AuthUser,
    @Query('topic') topic: string,
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    if (!topic || !topic.includes(':')) {
      throw new BadRequestException('topic must be formatted "<kind>:<id>".');
    }
    const [kind, id] = topic.split(':', 2);
    await this.assertAccess(user, kind, id);

    res.writeHead(200, SSE_HEADERS);
    res.flushHeaders();

    const write = (chunk: string) => res.write(chunk);
    const unsubscribe = this.bus.subscribe(topic, (payload) => {
      write(formatSseEvent({ event: 'message', data: payload }));
    });
    const stopHeartbeat = createHeartbeat(write);
    const closeTimer = setTimeout(() => {
      res.end();
    }, MAX_STREAM_DURATION_MS);

    const cleanup = () => {
      unsubscribe();
      stopHeartbeat();
      clearTimeout(closeTimer);
    };
    req.on('close', cleanup);
  }

  /** Non-throwing-permission check turned throwing at the transport boundary:
   *  reject the upgrade with 403 rather than open a stream nobody may read. */
  private async assertAccess(
    user: AuthUser,
    kind: string,
    id: string,
  ): Promise<void> {
    if (kind === 'salon') {
      const member = await this.database.withTenant(user.id, id, () =>
        this.memberships.findForUser(id, user.id),
      );
      if (!member) {
        throw new ForbiddenException('Not a member of this salon.');
      }
      return;
    }

    if (kind === 'queue' || kind === 'branch') {
      const branch = await this.database.withSystem(() =>
        this.database.db.query.branches.findFirst({
          where: eq(branches.id, id),
        }),
      );
      if (!branch) {
        throw new ForbiddenException('Unknown branch.');
      }
      const allowed = await this.database.withTenant(
        user.id,
        branch.salonId,
        () =>
          this.authorize.can(user, 'queue:view', {
            salonId: branch.salonId,
            branchId: branch.id,
          }),
      );
      if (!allowed) {
        throw new ForbiddenException('Missing permission: queue:view');
      }
      return;
    }

    throw new BadRequestException(`Unsupported topic kind "${kind}".`);
  }
}

import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PageQuery } from '../common/pagination.js';
import { DatabaseService } from '../persistence/database.service.js';
import {
  createHeartbeat,
  formatSseEvent,
  MAX_STREAM_DURATION_MS,
  SSE_HEADERS,
} from '../realtime/sse-framing.js';
import { RealtimeBus } from '../realtime/realtime-bus.js';
import { NotificationsRepo } from './data/notifications.repo.js';
import { ListNotifications } from './application/list-notifications.js';
import { MarkRead } from './application/mark-read.js';
import { MarkAllRead } from './application/mark-all-read.js';
import { UnreadCount } from './application/unread-count.js';
import type { NotificationPrincipal } from './notification-principal.js';

// TODO: also accept CustomerJwtAuthGuard once customer-auth lands — routes
// below are staff-only (JwtAuthGuard/AuthUser) until then.
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly bus: RealtimeBus,
    private readonly database: DatabaseService,
    private readonly repo: NotificationsRepo,
    private readonly listNotifications: ListNotifications,
    private readonly markReadUc: MarkRead,
    private readonly markAllReadUc: MarkAllRead,
    private readonly unreadCountUc: UnreadCount,
  ) {}

  @Get('stream')
  async stream(
    @CurrentUser() user: AuthUser,
    @Headers('last-event-id') lastEventId: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const principal: NotificationPrincipal = { kind: 'user', id: user.id };
    const topic = `notif:user:${user.id}`;

    res.writeHead(200, SSE_HEADERS);
    res.flushHeaders();
    const write = (chunk: string) => res.write(chunk);

    // Replay: on connect (or reconnect with Last-Event-ID), send everything
    // created after that point before switching to the live subscription, so
    // a client never misses a notification raised during the gap.
    const afterCreatedAt = lastEventId ? new Date(lastEventId) : undefined;
    const backlog = await this.database.withSystem(() =>
      this.repo.listForRecipient(principal, {
        limit: 100,
        afterCreatedAt:
          afterCreatedAt && !Number.isNaN(afterCreatedAt.getTime())
            ? afterCreatedAt
            : undefined,
      }),
    );
    for (const row of backlog.reverse()) {
      write(
        formatSseEvent({
          event: 'message',
          id: row.createdAt.toISOString(),
          data: { id: row.id, type: row.type, payload: row.payload },
        }),
      );
    }

    const unsubscribe = this.bus.subscribe(topic, (payload) => {
      write(formatSseEvent({ event: 'message', data: payload }));
    });
    const stopHeartbeat = createHeartbeat(write);
    const closeTimer = setTimeout(() => res.end(), MAX_STREAM_DURATION_MS);

    req.on('close', () => {
      unsubscribe();
      stopHeartbeat();
      clearTimeout(closeTimer);
    });
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PageQuery) {
    return this.listNotifications.execute({ kind: 'user', id: user.id }, query);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    const count = await this.unreadCountUc.execute({
      kind: 'user',
      id: user.id,
    });
    return { count };
  }

  @Post(':id/read')
  @HttpCode(204)
  async markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.markReadUc.execute({ kind: 'user', id: user.id }, id);
  }

  @Post('read-all')
  @HttpCode(204)
  async markAllRead(@CurrentUser() user: AuthUser) {
    await this.markAllReadUc.execute({ kind: 'user', id: user.id });
  }
}

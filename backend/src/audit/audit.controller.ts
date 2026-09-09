import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { ListAuditEvents } from './application/list-audit-events.js';
import { ListAuditQuery } from './dto/list-audit.dto.js';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class AuditController {
  constructor(private readonly listAuditEvents: ListAuditEvents) {}

  @Get('audit')
  list(@CurrentUser() user: AuthUser, @Query() query: ListAuditQuery) {
    return this.listAuditEvents.execute(user, query);
  }
}

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateTemplate } from './application/create-template.js';
import { ListDeliveries } from './application/list-deliveries.js';
import { ListTemplates } from './application/list-templates.js';
import {
  CreateTemplateDto,
  ListDeliveriesQuery,
} from './dto/notification-template.dto.js';

/** Customer-facing message templates and the delivery log (distinct from the
 *  staff in-app inbox in notifications.controller.ts). */
@ApiTags('notification-dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationDispatchController {
  constructor(
    private readonly listTemplatesUc: ListTemplates,
    private readonly createTemplateUc: CreateTemplate,
    private readonly listDeliveriesUc: ListDeliveries,
  ) {}

  @Get('templates')
  templates(@CurrentUser() user: AuthUser) {
    return this.listTemplatesUc.execute(user);
  }

  @Post('templates')
  createTemplate(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.createTemplateUc.execute(user, dto);
  }

  @Get('deliveries')
  deliveries(@CurrentUser() user: AuthUser, @Query() q: ListDeliveriesQuery) {
    return this.listDeliveriesUc.execute(user, q.from, q.to);
  }
}

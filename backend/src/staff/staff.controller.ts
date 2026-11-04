import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ListMembers } from '../rbac/application/list-members.js';
import { AcceptStaffInviteDto } from './dto/accept-invite.dto.js';
import { CreateStaffInviteDto } from './dto/staff-invite.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { CreateStaffInvite } from './application/create-staff-invite.js';
import { ListStaffInvites } from './application/list-staff-invites.js';
import { RevokeStaffInvite } from './application/revoke-staff-invite.js';
import { GetStaffInviteByToken } from './application/get-staff-invite-by-token.js';
import { AcceptStaffInvite } from './application/accept-staff-invite.js';
import { UpdateStaff } from './application/update-staff.js';

@ApiTags('staff')
@Controller({ version: '1' })
export class StaffController {
  constructor(
    private readonly listMembersUc: ListMembers,
    private readonly createInviteUc: CreateStaffInvite,
    private readonly listInvitesUc: ListStaffInvites,
    private readonly revokeInviteUc: RevokeStaffInvite,
    private readonly getInviteByTokenUc: GetStaffInviteByToken,
    private readonly acceptInviteUc: AcceptStaffInvite,
    private readonly updateStaffUc: UpdateStaff,
  ) {}

  @Post('staff/invites')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createInvite(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffInviteDto) {
    return this.createInviteUc.execute(user, dto);
  }

  @Get('staff/invites')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listInvites(@CurrentUser() user: AuthUser) {
    return this.listInvitesUc.execute(user);
  }

  @Post('staff/invites/:id/revoke')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async revokeInvite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.revokeInviteUc.execute(user, id);
  }

  /** Public — no JwtAuthGuard. Powers the accept-flow UI before sign-in. */
  @Get('staff/invites/:token')
  getInviteByToken(@Param('token') token: string) {
    return this.getInviteByTokenUc.execute(token);
  }

  /** Public — the invitee is not signed in yet. */
  @Post('staff/invites/:token/accept')
  acceptInvite(
    @Param('token') token: string,
    @Body() dto: AcceptStaffInviteDto,
    @Req() req: Request,
  ) {
    return this.acceptInviteUc.execute(token, dto, {
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    });
  }

  @Get('staff')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthUser) {
    return this.listMembersUc.execute(user);
  }

  @Patch('staff/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.updateStaffUc.execute(user, userId, dto);
  }
}

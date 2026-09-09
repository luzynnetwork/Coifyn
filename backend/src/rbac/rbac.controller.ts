import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import {
  AssignRoleDto,
  CreateRoleDto,
  SetBranchMembershipsDto,
  UpdateRoleDto,
} from './dto/role.dto.js';
import { AssignRole } from './application/assign-role.js';
import { CreateRole } from './application/create-role.js';
import { DeleteRole } from './application/delete-role.js';
import { ListMembers } from './application/list-members.js';
import { ListPermissions } from './application/list-permissions.js';
import { ListRoles } from './application/list-roles.js';
import { SetBranchMemberships } from './application/set-branch-memberships.js';
import { UpdateRole } from './application/update-role.js';

@ApiTags('rbac')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class RbacController {
  constructor(
    private readonly listPermissions: ListPermissions,
    private readonly listRoles: ListRoles,
    private readonly createRole: CreateRole,
    private readonly updateRole: UpdateRole,
    private readonly deleteRole: DeleteRole,
    private readonly listMembers: ListMembers,
    private readonly assignRole: AssignRole,
    private readonly setBranchMemberships: SetBranchMemberships,
  ) {}

  @Get('permissions')
  permissions() {
    return this.listPermissions.execute();
  }

  @Get('roles')
  roles(@CurrentUser() user: AuthUser) {
    return this.listRoles.execute(user);
  }

  @Post('roles')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoleDto) {
    return this.createRole.execute(user, dto);
  }

  @Patch('roles/:id')
  @HttpCode(204)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    await this.updateRole.execute(user, id, dto);
  }

  @Delete('roles/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deleteRole.execute(user, id);
  }

  @Get('members')
  members(@CurrentUser() user: AuthUser) {
    return this.listMembers.execute(user);
  }

  @Post('members/:userId/role')
  @HttpCode(204)
  async assign(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    await this.assignRole.execute(user, userId, dto.roleId);
  }

  @Put('members/:userId/branches')
  @HttpCode(204)
  async branches(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() dto: SetBranchMembershipsDto,
  ) {
    await this.setBranchMemberships.execute(user, userId, dto.branchIds);
  }
}

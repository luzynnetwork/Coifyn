import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthUser } from './auth-user.js';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateMeDto,
} from './dto/auth.dto.js';
import { GetMe } from './application/get-me.js';
import { Login } from './application/login.js';
import { Logout } from './application/logout.js';
import { Refresh } from './application/refresh.js';
import { Register } from './application/register.js';
import { RequestPasswordReset } from './application/request-password-reset.js';
import { ResetPassword } from './application/reset-password.js';
import { UpdateMe } from './application/update-me.js';
import type { SessionContext } from './application/issue-session.js';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly register: Register,
    private readonly login: Login,
    private readonly refresh: Refresh,
    private readonly logout: Logout,
    private readonly getMe: GetMe,
    private readonly updateMe: UpdateMe,
    private readonly requestPasswordReset: RequestPasswordReset,
    private readonly resetPassword: ResetPassword,
  ) {}

  @Post('register')
  registerAccount(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.register.execute(dto, sessionContext(req));
  }

  @Post('login')
  @HttpCode(200)
  loginAccount(@Body() dto: LoginDto, @Req() req: Request) {
    return this.login.execute(dto, sessionContext(req));
  }

  @Post('refresh')
  @HttpCode(200)
  refreshTokens(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.refresh.execute(dto, sessionContext(req));
  }

  @Post('logout')
  @HttpCode(204)
  async logoutAccount(@Body() dto: LogoutDto) {
    await this.logout.execute(dto);
  }

  @Post('forgot-password')
  @HttpCode(202)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.requestPasswordReset.execute(dto);
  }

  @Post('reset-password')
  @HttpCode(204)
  async doResetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPassword.execute(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.getMe.execute(user);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  patchMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.updateMe.execute(user, dto);
  }
}

function sessionContext(req: Request): SessionContext {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ip: req.ip ?? null,
  };
}

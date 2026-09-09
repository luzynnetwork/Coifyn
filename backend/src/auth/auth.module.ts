import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { UsersRepo } from './data/users.repo.js';
import { SessionsRepo } from './data/sessions.repo.js';
import { PasswordResetsRepo } from './data/password-resets.repo.js';
import { PasswordService } from './lib/password.js';
import { TokenService } from './lib/tokens.js';
import { IssueSession } from './application/issue-session.js';
import { Register } from './application/register.js';
import { Login } from './application/login.js';
import { Refresh } from './application/refresh.js';
import { Logout } from './application/logout.js';
import { GetMe } from './application/get-me.js';
import { UpdateMe } from './application/update-me.js';
import { RequestPasswordReset } from './application/request-password-reset.js';
import { ResetPassword } from './application/reset-password.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

/**
 * Staff authentication. One provider per operation (application/*), one repo per
 * table (data/*). JwtAuthGuard is exported so feature modules can guard their
 * routes; other modules that need the current user's identity import this.
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    UsersRepo,
    SessionsRepo,
    PasswordResetsRepo,
    PasswordService,
    TokenService,
    IssueSession,
    Register,
    Login,
    Refresh,
    Logout,
    GetMe,
    UpdateMe,
    RequestPasswordReset,
    ResetPassword,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, TokenService, UsersRepo],
})
export class AuthModule {}

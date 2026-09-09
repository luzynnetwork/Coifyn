import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service.js';
import { SessionsRepo } from '../data/sessions.repo.js';
import { TokenService } from '../lib/tokens.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface SessionContext {
  userAgent?: string | null;
  ip?: string | null;
}

/**
 * Creates a session row and the matching access + refresh token pair. Shared by
 * register, login and refresh — the one place the token shape is decided.
 */
@Injectable()
export class IssueSession {
  constructor(
    private readonly sessions: SessionsRepo,
    private readonly tokens: TokenService,
    private readonly config: AppConfigService,
  ) {}

  async forNewSession(
    user: { id: string; email: string },
    ctx: SessionContext,
  ): Promise<AuthTokens> {
    const refresh = this.tokens.newRefreshToken();
    const session = await this.sessions.create({
      userId: user.id,
      refreshTokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    });
    return this.pair(user, session.id, refresh.token);
  }

  async forRotatedSession(
    user: { id: string; email: string },
    oldSessionId: string,
    ctx: SessionContext,
  ): Promise<AuthTokens> {
    const refresh = this.tokens.newRefreshToken();
    const session = await this.sessions.rotate(oldSessionId, {
      userId: user.id,
      refreshTokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    });
    return this.pair(user, session.id, refresh.token);
  }

  private async pair(
    user: { id: string; email: string },
    sessionId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.tokens.signAccess({
      sub: user.id,
      sid: sessionId,
      email: user.email,
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get('JWT_ACCESS_TTL'),
    };
  }
}

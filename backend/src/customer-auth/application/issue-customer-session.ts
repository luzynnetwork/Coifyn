import { Injectable } from '@nestjs/common';
import { CustomerSessionsRepo } from '../data/customer-sessions.repo.js';
import { CustomerTokenService } from '../lib/customer-tokens.js';
import { AppConfigService } from '../../config/config.service.js';

export interface CustomerAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface CustomerSessionContext {
  userAgent?: string | null;
  ip?: string | null;
}

/**
 * Creates a customer_session row and the matching access + refresh token pair.
 * Shared by register/verify, login and any future rotation — the one place the
 * customer token shape is decided (mirrors auth/application/issue-session.ts).
 */
@Injectable()
export class IssueCustomerSession {
  constructor(
    private readonly sessions: CustomerSessionsRepo,
    private readonly tokens: CustomerTokenService,
    private readonly config: AppConfigService,
  ) {}

  async forNewSession(
    customer: { id: string; email: string | null; phone: string | null },
    ctx: CustomerSessionContext,
  ): Promise<CustomerAuthTokens> {
    const refresh = this.tokens.newRefreshToken();
    const session = await this.sessions.create({
      customerId: customer.id,
      refreshTokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    });
    return this.pair(customer, session.id, refresh.token);
  }

  async forRotatedSession(
    customer: { id: string; email: string | null; phone: string | null },
    oldSessionId: string,
    ctx: CustomerSessionContext,
  ): Promise<CustomerAuthTokens> {
    const refresh = this.tokens.newRefreshToken();
    const session = await this.sessions.rotate(oldSessionId, {
      customerId: customer.id,
      refreshTokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    });
    return this.pair(customer, session.id, refresh.token);
  }

  private async pair(
    customer: { id: string },
    sessionId: string,
    refreshToken: string,
  ): Promise<CustomerAuthTokens> {
    const accessToken = await this.tokens.signAccess({
      sub: customer.id,
      sid: sessionId,
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get('CUSTOMER_JWT_ACCESS_TTL'),
    };
  }
}

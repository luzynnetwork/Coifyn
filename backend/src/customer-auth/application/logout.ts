import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomerSessionsRepo } from '../data/customer-sessions.repo.js';
import { CustomerTokenService } from '../lib/customer-tokens.js';
import { LogoutCustomerDto } from '../dto/customer-auth.dto.js';

@Injectable()
export class LogoutCustomer {
  constructor(
    private readonly database: DatabaseService,
    private readonly sessions: CustomerSessionsRepo,
    private readonly tokens: CustomerTokenService,
  ) {}

  /** Revokes the session behind the presented refresh token. Idempotent — an
   *  unknown or already-revoked token is a no-op, not an error. */
  async execute(dto: LogoutCustomerDto): Promise<void> {
    await this.database.withAnon(async () => {
      const hash = this.tokens.hashRefreshToken(dto.refreshToken);
      const session = await this.sessions.findActiveByRefreshHash(hash);
      if (session) await this.sessions.revoke(session.id);
    });
  }
}

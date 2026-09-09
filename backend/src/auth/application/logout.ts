import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { SessionsRepo } from '../data/sessions.repo.js';
import { TokenService } from '../lib/tokens.js';
import { LogoutDto } from '../dto/auth.dto.js';

@Injectable()
export class Logout {
  constructor(
    private readonly database: DatabaseService,
    private readonly sessions: SessionsRepo,
    private readonly tokens: TokenService,
  ) {}

  /** Revokes the session behind the presented refresh token. Idempotent — an
   *  unknown or already-revoked token is a no-op, not an error. */
  async execute(dto: LogoutDto): Promise<void> {
    await this.database.withAnon(async () => {
      const hash = this.tokens.hashRefreshToken(dto.refreshToken);
      const session = await this.sessions.findActiveByRefreshHash(hash);
      if (session) await this.sessions.revoke(session.id);
    });
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { SessionsRepo } from '../data/sessions.repo.js';
import { UsersRepo } from '../data/users.repo.js';
import { TokenService } from '../lib/tokens.js';
import { RefreshDto } from '../dto/auth.dto.js';
import { AuthTokens, IssueSession, SessionContext } from './issue-session.js';

/**
 * Rotating refresh: the presented token is consumed (its session revoked) and a
 * new session + token pair is issued. A token that does not match an active
 * session — including one already rotated — is rejected.
 */
@Injectable()
export class Refresh {
  constructor(
    private readonly database: DatabaseService,
    private readonly sessions: SessionsRepo,
    private readonly users: UsersRepo,
    private readonly tokens: TokenService,
    private readonly issueSession: IssueSession,
  ) {}

  async execute(dto: RefreshDto, ctx: SessionContext): Promise<AuthTokens> {
    return this.database.withAnon(async () => {
      const hash = this.tokens.hashRefreshToken(dto.refreshToken);
      const session = await this.sessions.findActiveByRefreshHash(hash);
      if (!session || session.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }
      const user = await this.users.findById(session.userId);
      if (!user || user.status !== 'active') {
        await this.sessions.revoke(session.id);
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }
      return this.issueSession.forRotatedSession(user, session.id, ctx);
    });
  }
}

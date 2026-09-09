import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../../persistence/database.service.js';
import { SessionsRepo } from '../data/sessions.repo.js';
import { UsersRepo } from '../data/users.repo.js';
import { TokenService } from '../lib/tokens.js';
import { AuthUser } from '../auth-user.js';

/**
 * Guards every staff endpoint that is not explicitly public. Verifies the access
 * token's signature, then confirms the session is still active and the user row
 * still exists and is active — a self-contained JWT would otherwise stay valid
 * after a logout or account disable until it expired.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly database: DatabaseService,
    private readonly sessions: SessionsRepo,
    private readonly users: UsersRepo,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    let claims: Awaited<ReturnType<TokenService['verifyAccess']>>;
    try {
      claims = await this.tokens.verifyAccess(header.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const user = await this.database.withAnon(async () => {
      const session = await this.sessions.findActiveById(claims.sid);
      if (!session || session.userId !== claims.sub) return null;
      const row = await this.users.findById(claims.sub);
      return row && row.status === 'active' ? row : null;
    });

    if (!user) throw new UnauthorizedException('Session is no longer valid.');

    const principal: AuthUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      sessionId: claims.sid,
    };
    (req as Request & { user?: AuthUser }).user = principal;
    return true;
  }
}

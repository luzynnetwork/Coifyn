import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { UsersRepo } from '../data/users.repo.js';
import { PasswordService } from '../lib/password.js';
import { LoginDto } from '../dto/auth.dto.js';
import { AuthTokens, IssueSession, SessionContext } from './issue-session.js';

@Injectable()
export class Login {
  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepo,
    private readonly passwords: PasswordService,
    private readonly issueSession: IssueSession,
    private readonly events: EventBus,
  ) {}

  async execute(dto: LoginDto, ctx: SessionContext): Promise<AuthTokens> {
    return this.database.withAnon(async () => {
      const user = await this.users.findByEmail(dto.email);

      // Same error and roughly the same work whether the user exists or not —
      // the response must not reveal which.
      const hash =
        user?.passwordHash ??
        '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$0000000000000000000000000000000000000000000';
      const ok = await this.passwords.verify(hash, dto.password);

      if (!user || !ok || user.status !== 'active') {
        throw new UnauthorizedException('Invalid email or password.');
      }

      if (this.passwords.needsRehash(user.passwordHash)) {
        await this.users.updatePasswordHash(
          user.id,
          await this.passwords.hash(dto.password),
        );
      }

      const tokens = await this.issueSession.forNewSession(user, ctx);
      await this.events.emit({
        aggregateType: 'user',
        aggregateId: user.id,
        type: 'UserLoggedIn',
        payload: { email: user.email },
      });
      return tokens;
    });
  }
}

import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { UsersRepo } from '../data/users.repo.js';
import { PasswordService } from '../lib/password.js';
import { RegisterDto } from '../dto/auth.dto.js';
import { AuthTokens, IssueSession, SessionContext } from './issue-session.js';

/**
 * Creates a bare staff user and signs them in. This is the identity half only —
 * turning a user into a salon Owner (creating the salon, seeding standard roles,
 * assigning membership) is the onboarding flow that lands with the tenancy/rbac
 * modules.
 */
@Injectable()
export class Register {
  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepo,
    private readonly passwords: PasswordService,
    private readonly issueSession: IssueSession,
  ) {}

  async execute(
    dto: RegisterDto,
    ctx: SessionContext,
  ): Promise<{ userId: string; tokens: AuthTokens }> {
    return this.database.withAnon(async () => {
      const existing = await this.users.findByEmail(dto.email);
      if (existing) {
        // A generic message either way would be friendlier for privacy, but a
        // duplicate email genuinely cannot proceed and the address is the one
        // the caller just typed.
        throw new ConflictException('An account with that email already exists.');
      }
      const passwordHash = await this.passwords.hash(dto.password);
      const user = await this.users.create({
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      });
      const tokens = await this.issueSession.forNewSession(user, ctx);
      return { userId: user.id, tokens };
    });
  }
}

import { createHash, randomInt } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { PasswordResetsRepo } from '../data/password-resets.repo.js';
import { UsersRepo } from '../data/users.repo.js';
import { ForgotPasswordDto } from '../dto/auth.dto.js';

/** Minutes a reset code stays valid. */
const CODE_TTL_MS = 15 * 60 * 1000;

/**
 * Issues a single-use 6-digit reset code. Delivery (email) is deferred to the
 * notifications phase — for now the code is logged in non-production so the flow
 * is testable. The response is always a generic success so it never reveals
 * whether an account exists.
 */
@Injectable()
export class RequestPasswordReset {
  private readonly logger = new Logger(RequestPasswordReset.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepo,
    private readonly resets: PasswordResetsRepo,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    await this.database.withAnon(async () => {
      const user = await this.users.findByEmail(dto.email);
      if (!user || user.status !== 'active') return;

      await this.resets.invalidateAllForUser(user.id);
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await this.resets.create({
        userId: user.id,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      });

      // TODO(notifications phase): send this by email instead of logging.
      this.logger.debug(`password reset code for ${user.email}: ${code}`);
    });
  }
}

export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

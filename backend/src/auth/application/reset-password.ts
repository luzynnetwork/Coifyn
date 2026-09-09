import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { PasswordResetsRepo } from '../data/password-resets.repo.js';
import { SessionsRepo } from '../data/sessions.repo.js';
import { UsersRepo } from '../data/users.repo.js';
import { PasswordService } from '../lib/password.js';
import { ResetPasswordDto } from '../dto/auth.dto.js';
import { hashCode } from './request-password-reset.js';

/**
 * Verifies the code, sets the new password, consumes every outstanding reset for
 * the user, and revokes all their sessions so a stolen code cannot leave a live
 * session behind.
 */
@Injectable()
export class ResetPassword {
  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepo,
    private readonly resets: PasswordResetsRepo,
    private readonly sessions: SessionsRepo,
    private readonly passwords: PasswordService,
    private readonly events: EventBus,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    await this.database.withAnon(async () => {
      const user = await this.users.findByEmail(dto.email);
      if (!user) throw new UnauthorizedException('Invalid or expired code.');

      const reset = await this.resets.findValid(user.id, hashCode(dto.code));
      if (!reset) throw new UnauthorizedException('Invalid or expired code.');

      await this.users.updatePasswordHash(
        user.id,
        await this.passwords.hash(dto.newPassword),
      );
      await this.resets.invalidateAllForUser(user.id);
      await this.sessions.revokeAllForUser(user.id);
      await this.events.emit({
        aggregateType: 'user',
        aggregateId: user.id,
        type: 'PasswordResetCompleted',
        payload: { userId: user.id },
      });
    });
  }
}

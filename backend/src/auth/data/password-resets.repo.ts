import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { passwordResets } from '../../persistence/schema/index.js';

export type PasswordResetRow = typeof passwordResets.$inferSelect;

@Injectable()
export class PasswordResetsRepo {
  constructor(private readonly database: DatabaseService) {}

  async create(input: {
    userId: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetRow> {
    const [row] = await this.database.db
      .insert(passwordResets)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  /** An unconsumed, unexpired reset for this user + code hash. */
  findValid(
    userId: string,
    codeHash: string,
  ): Promise<PasswordResetRow | undefined> {
    return this.database.db.query.passwordResets.findFirst({
      where: and(
        eq(passwordResets.userId, userId),
        eq(passwordResets.codeHash, codeHash),
        isNull(passwordResets.consumedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    });
  }

  async consume(id: string): Promise<void> {
    await this.database.db
      .update(passwordResets)
      .set({ consumedAt: new Date() })
      .where(eq(passwordResets.id, id));
  }

  /** Consume every outstanding reset for a user — called when a new one is
   *  requested and after a successful reset, so a code is never reusable. */
  async invalidateAllForUser(userId: string): Promise<void> {
    await this.database.db
      .update(passwordResets)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(passwordResets.userId, userId),
          isNull(passwordResets.consumedAt),
        ),
      );
  }
}

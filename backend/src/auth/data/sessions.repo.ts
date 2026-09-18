import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { sessions } from '../../persistence/schema/index.js';

export type SessionRow = typeof sessions.$inferSelect;

@Injectable()
export class SessionsRepo {
  constructor(private readonly database: DatabaseService) {}

  async create(input: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<SessionRow> {
    const [row] = await this.database.db
      .insert(sessions)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  /** An active (not revoked, not expired) session matching this refresh hash. */
  findActiveByRefreshHash(hash: string): Promise<SessionRow | undefined> {
    return this.database.db.query.sessions.findFirst({
      where: and(
        eq(sessions.refreshTokenHash, hash),
        isNull(sessions.revokedAt),
      ),
    });
  }

  findActiveById(id: string): Promise<SessionRow | undefined> {
    return this.database.db.query.sessions.findFirst({
      where: and(eq(sessions.id, id), isNull(sessions.revokedAt)),
    });
  }

  async rotate(
    oldId: string,
    next: {
      userId: string;
      refreshTokenHash: string;
      expiresAt: Date;
      userAgent?: string | null;
      ip?: string | null;
    },
  ): Promise<SessionRow> {
    await this.revoke(oldId);
    return this.create(next);
  }

  async revoke(id: string): Promise<void> {
    await this.database.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
  }

  /** Revoke every active session for a user — used after a password reset. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.database.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }
}

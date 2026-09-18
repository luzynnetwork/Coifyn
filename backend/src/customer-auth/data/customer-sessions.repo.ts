import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { customerSessions } from '../../persistence/schema/index.js';

export type CustomerSessionRow = typeof customerSessions.$inferSelect;

@Injectable()
export class CustomerSessionsRepo {
  constructor(private readonly database: DatabaseService) {}

  async create(input: {
    customerId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<CustomerSessionRow> {
    const [row] = await this.database.db
      .insert(customerSessions)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  findActiveByRefreshHash(
    hash: string,
  ): Promise<CustomerSessionRow | undefined> {
    return this.database.db.query.customerSessions.findFirst({
      where: and(
        eq(customerSessions.refreshTokenHash, hash),
        isNull(customerSessions.revokedAt),
      ),
    });
  }

  findActiveById(id: string): Promise<CustomerSessionRow | undefined> {
    return this.database.db.query.customerSessions.findFirst({
      where: and(eq(customerSessions.id, id), isNull(customerSessions.revokedAt)),
    });
  }

  async rotate(
    oldId: string,
    next: {
      customerId: string;
      refreshTokenHash: string;
      expiresAt: Date;
      userAgent?: string | null;
      ip?: string | null;
    },
  ): Promise<CustomerSessionRow> {
    await this.revoke(oldId);
    return this.create(next);
  }

  async revoke(id: string): Promise<void> {
    await this.database.db
      .update(customerSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(customerSessions.id, id), isNull(customerSessions.revokedAt)));
  }

  async revokeAllForCustomer(customerId: string): Promise<void> {
    await this.database.db
      .update(customerSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(customerSessions.customerId, customerId),
          isNull(customerSessions.revokedAt),
        ),
      );
  }
}

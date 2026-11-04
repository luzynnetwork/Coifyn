import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { registerSessions } from '../../persistence/schema/index.js';

export type RegisterSessionRow = typeof registerSessions.$inferSelect;

@Injectable()
export class RegisterSessionsRepo {
  constructor(private readonly database: DatabaseService) {}

  findOpen(
    salonId: string,
    branchId: string,
  ): Promise<RegisterSessionRow | undefined> {
    return this.database.db.query.registerSessions.findFirst({
      where: and(
        eq(registerSessions.salonId, salonId),
        eq(registerSessions.branchId, branchId),
        isNull(registerSessions.closedAt),
        isNull(registerSessions.deletedAt),
      ),
    });
  }

  findById(
    salonId: string,
    id: string,
  ): Promise<RegisterSessionRow | undefined> {
    return this.database.db.query.registerSessions.findFirst({
      where: and(
        eq(registerSessions.id, id),
        eq(registerSessions.salonId, salonId),
        isNull(registerSessions.deletedAt),
      ),
    });
  }

  async open(input: {
    salonId: string;
    branchId: string;
    openedBy: string;
    openingFloatMinor: number;
  }): Promise<RegisterSessionRow> {
    const [row] = await this.database.db
      .insert(registerSessions)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async close(
    salonId: string,
    id: string,
    closingCountMinor: number,
  ): Promise<RegisterSessionRow | undefined> {
    const [row] = await this.database.db
      .update(registerSessions)
      .set({ closingCountMinor, closedAt: new Date() })
      .where(
        and(eq(registerSessions.id, id), eq(registerSessions.salonId, salonId)),
      )
      .returning();
    return row;
  }
}

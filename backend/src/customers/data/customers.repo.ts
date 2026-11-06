import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { salonCustomers } from '../../persistence/schema/index.js';

export type CustomerRow = typeof salonCustomers.$inferSelect;

@Injectable()
export class CustomersRepo {
  constructor(private readonly database: DatabaseService) {}

  list(salonId: string, search?: string): Promise<CustomerRow[]> {
    const term = search?.trim();
    return this.database.db.query.salonCustomers.findMany({
      where: and(
        eq(salonCustomers.salonId, salonId),
        isNull(salonCustomers.deletedAt),
        term
          ? or(
              ilike(salonCustomers.name, `%${term}%`),
              ilike(salonCustomers.phone, `%${term}%`),
            )
          : undefined,
      ),
      orderBy: desc(salonCustomers.createdAt),
      limit: 200,
    });
  }

  findById(salonId: string, id: string): Promise<CustomerRow | undefined> {
    return this.database.db.query.salonCustomers.findFirst({
      where: and(
        eq(salonCustomers.id, id),
        eq(salonCustomers.salonId, salonId),
        isNull(salonCustomers.deletedAt),
      ),
    });
  }

  findByPhone(salonId: string, phone: string): Promise<CustomerRow | undefined> {
    return this.database.db.query.salonCustomers.findFirst({
      where: and(
        eq(salonCustomers.salonId, salonId),
        eq(salonCustomers.phone, phone),
        isNull(salonCustomers.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    name: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
  }): Promise<CustomerRow> {
    const [row] = await this.database.db
      .insert(salonCustomers)
      .values({
        id: uuidv7(),
        salonId: input.salonId,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        notes: input.notes ?? null,
      })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<Pick<CustomerRow, 'name' | 'phone' | 'email' | 'notes'>>,
  ): Promise<CustomerRow | undefined> {
    const [row] = await this.database.db
      .update(salonCustomers)
      .set(patch)
      .where(and(eq(salonCustomers.id, id), eq(salonCustomers.salonId, salonId)))
      .returning();
    return row;
  }

  /** Atomic increment — call inside the same transaction as the payment. */
  async recordVisit(
    salonId: string,
    id: string,
    spendMinor: number,
  ): Promise<CustomerRow | undefined> {
    const [row] = await this.database.db
      .update(salonCustomers)
      .set({
        lastVisitAt: new Date(),
        visitCount: sql`${salonCustomers.visitCount} + 1`,
        totalSpendMinor: sql`${salonCustomers.totalSpendMinor} + ${spendMinor}`,
      })
      .where(and(eq(salonCustomers.id, id), eq(salonCustomers.salonId, salonId)))
      .returning();
    return row;
  }
}

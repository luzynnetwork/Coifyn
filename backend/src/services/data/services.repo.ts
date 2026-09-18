import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { services } from '../../persistence/schema/index.js';

export type ServiceRow = typeof services.$inferSelect;

@Injectable()
export class ServicesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForSalon(salonId: string): Promise<ServiceRow[]> {
    return this.database.db.query.services.findMany({
      where: and(eq(services.salonId, salonId), isNull(services.deletedAt)),
    });
  }

  findById(salonId: string, id: string): Promise<ServiceRow | undefined> {
    return this.database.db.query.services.findFirst({
      where: and(
        eq(services.id, id),
        eq(services.salonId, salonId),
        isNull(services.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    categoryId: string | null;
    name: string;
    description: string | null;
    basePriceMinor: number;
    baseDurationMin: number;
    taxRateId: string | null;
    isBookable: boolean;
  }): Promise<ServiceRow> {
    const [row] = await this.database.db
      .insert(services)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<
      Pick<
        ServiceRow,
        | 'categoryId'
        | 'name'
        | 'description'
        | 'basePriceMinor'
        | 'baseDurationMin'
        | 'taxRateId'
        | 'isBookable'
        | 'isActive'
      >
    >,
  ): Promise<ServiceRow | undefined> {
    const [row] = await this.database.db
      .update(services)
      .set(patch)
      .where(and(eq(services.id, id), eq(services.salonId, salonId)))
      .returning();
    return row;
  }

  async softDelete(salonId: string, id: string): Promise<void> {
    await this.database.db
      .update(services)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(services.id, id), eq(services.salonId, salonId)));
  }
}

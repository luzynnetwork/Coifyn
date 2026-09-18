import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { serviceAddOns } from '../../persistence/schema/index.js';

export type ServiceAddOnRow = typeof serviceAddOns.$inferSelect;

@Injectable()
export class ServiceAddOnsRepo {
  constructor(private readonly database: DatabaseService) {}

  listForSalon(salonId: string): Promise<ServiceAddOnRow[]> {
    return this.database.db.query.serviceAddOns.findMany({
      where: and(
        eq(serviceAddOns.salonId, salonId),
        isNull(serviceAddOns.deletedAt),
      ),
    });
  }

  findById(salonId: string, id: string): Promise<ServiceAddOnRow | undefined> {
    return this.database.db.query.serviceAddOns.findFirst({
      where: and(
        eq(serviceAddOns.id, id),
        eq(serviceAddOns.salonId, salonId),
        isNull(serviceAddOns.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    name: string;
    priceMinor: number;
    durationMin: number;
  }): Promise<ServiceAddOnRow> {
    const [row] = await this.database.db
      .insert(serviceAddOns)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<
      Pick<ServiceAddOnRow, 'name' | 'priceMinor' | 'durationMin' | 'isActive'>
    >,
  ): Promise<ServiceAddOnRow | undefined> {
    const [row] = await this.database.db
      .update(serviceAddOns)
      .set(patch)
      .where(and(eq(serviceAddOns.id, id), eq(serviceAddOns.salonId, salonId)))
      .returning();
    return row;
  }
}

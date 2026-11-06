import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { serviceCategories } from '../../persistence/schema/index.js';

export type ServiceCategoryRow = typeof serviceCategories.$inferSelect;

@Injectable()
export class ServiceCategoriesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForSalon(salonId: string): Promise<ServiceCategoryRow[]> {
    return this.database.db.query.serviceCategories.findMany({
      where: and(
        eq(serviceCategories.salonId, salonId),
        isNull(serviceCategories.deletedAt),
      ),
      orderBy: asc(serviceCategories.order),
    });
  }

  findById(
    salonId: string,
    id: string,
  ): Promise<ServiceCategoryRow | undefined> {
    return this.database.db.query.serviceCategories.findFirst({
      where: and(
        eq(serviceCategories.id, id),
        eq(serviceCategories.salonId, salonId),
        isNull(serviceCategories.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    name: string;
    order: number;
  }): Promise<ServiceCategoryRow> {
    const [row] = await this.database.db
      .insert(serviceCategories)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<Pick<ServiceCategoryRow, 'name' | 'order'>>,
  ): Promise<ServiceCategoryRow | undefined> {
    const [row] = await this.database.db
      .update(serviceCategories)
      .set(patch)
      .where(
        and(eq(serviceCategories.id, id), eq(serviceCategories.salonId, salonId)),
      )
      .returning();
    return row;
  }
}

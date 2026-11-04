import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { customerTags } from '../../persistence/schema/index.js';

@Injectable()
export class CustomerTagsRepo {
  constructor(private readonly database: DatabaseService) {}

  list(salonId: string, customerId: string) {
    return this.database.db.query.customerTags.findMany({
      where: and(
        eq(customerTags.salonId, salonId),
        eq(customerTags.customerId, customerId),
      ),
    });
  }

  async add(salonId: string, customerId: string, tag: string) {
    await this.database.db
      .insert(customerTags)
      .values({ id: uuidv7(), salonId, customerId, tag })
      .onConflictDoNothing();
    return this.list(salonId, customerId);
  }
}

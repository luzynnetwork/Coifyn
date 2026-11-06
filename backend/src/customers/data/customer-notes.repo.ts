import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { customerNotes } from '../../persistence/schema/index.js';

@Injectable()
export class CustomerNotesRepo {
  constructor(private readonly database: DatabaseService) {}

  list(salonId: string, customerId: string) {
    return this.database.db.query.customerNotes.findMany({
      where: and(
        eq(customerNotes.salonId, salonId),
        eq(customerNotes.customerId, customerId),
      ),
      orderBy: desc(customerNotes.createdAt),
      limit: 100,
    });
  }

  async add(input: {
    salonId: string;
    customerId: string;
    authorId: string;
    body: string;
  }) {
    const [row] = await this.database.db
      .insert(customerNotes)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }
}

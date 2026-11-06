import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { bookingRequests } from '../../persistence/schema/index.js';

export type BookingRequestRow = typeof bookingRequests.$inferSelect;
export type BookingRequestStatus = 'requested' | 'confirmed' | 'declined';

@Injectable()
export class BookingRequestsRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<BookingRequestRow | undefined> {
    return this.database.db.query.bookingRequests.findFirst({
      where: and(
        eq(bookingRequests.id, id),
        eq(bookingRequests.salonId, salonId),
        isNull(bookingRequests.deletedAt),
      ),
    });
  }

  list(salonId: string, branchId: string, status?: BookingRequestStatus) {
    return this.database.db.query.bookingRequests.findMany({
      where: and(
        eq(bookingRequests.salonId, salonId),
        eq(bookingRequests.branchId, branchId),
        isNull(bookingRequests.deletedAt),
        status ? eq(bookingRequests.status, status) : undefined,
      ),
      orderBy: desc(bookingRequests.createdAt),
      limit: 200,
    });
  }

  countOpenForPhone(salonId: string, phone: string): Promise<number> {
    return this.database.db.query.bookingRequests
      .findMany({
        where: and(
          eq(bookingRequests.salonId, salonId),
          eq(bookingRequests.customerPhone, phone),
          eq(bookingRequests.status, 'requested'),
          isNull(bookingRequests.deletedAt),
        ),
      })
      .then((rows) => rows.length);
  }

  async create(input: {
    salonId: string;
    branchId: string;
    stylistId: string;
    serviceIds: string[];
    startAt: Date;
    endAt: Date;
    customerName: string;
    customerPhone: string;
    notes: string | null;
  }): Promise<BookingRequestRow> {
    const [row] = await this.database.db
      .insert(bookingRequests)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async decide(
    salonId: string,
    id: string,
    patch: {
      status: 'confirmed' | 'declined';
      decidedBy: string;
      appointmentId?: string;
    },
  ): Promise<BookingRequestRow | undefined> {
    const [row] = await this.database.db
      .update(bookingRequests)
      .set(patch)
      .where(and(eq(bookingRequests.id, id), eq(bookingRequests.salonId, salonId)))
      .returning();
    return row;
  }
}

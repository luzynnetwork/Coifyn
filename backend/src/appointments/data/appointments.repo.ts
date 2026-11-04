import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { appointments } from '../../persistence/schema/index.js';

export type AppointmentRow = typeof appointments.$inferSelect;
export type AppointmentStatus =
  | 'booked'
  | 'arrived'
  | 'in_service'
  | 'completed'
  | 'no_show'
  | 'cancelled';

/** Statuses that occupy a stylist and chair. */
export const ACTIVE_STATUSES: AppointmentStatus[] = [
  'booked',
  'arrived',
  'in_service',
];

export type AppointmentPatch = Partial<
  Pick<
    AppointmentRow,
    | 'stylistId'
    | 'chairId'
    | 'customerId'
    | 'serviceIds'
    | 'addOnIds'
    | 'startAt'
    | 'endAt'
    | 'status'
    | 'notes'
  >
>;

@Injectable()
export class AppointmentsRepo {
  constructor(private readonly database: DatabaseService) {}

  listBetween(
    salonId: string,
    branchId: string,
    from: Date,
    to: Date,
  ): Promise<AppointmentRow[]> {
    return this.database.db.query.appointments.findMany({
      where: and(
        eq(appointments.salonId, salonId),
        eq(appointments.branchId, branchId),
        gt(appointments.endAt, from),
        lt(appointments.startAt, to),
        isNull(appointments.deletedAt),
      ),
      orderBy: asc(appointments.startAt),
    });
  }

  findById(salonId: string, id: string): Promise<AppointmentRow | undefined> {
    return this.database.db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.salonId, salonId),
        isNull(appointments.deletedAt),
      ),
    });
  }

  /**
   * Serialises concurrent bookings for the same stylist/chair until this
   * transaction ends. Without it two simultaneous requests could both pass the
   * overlap check and both insert. Keys are sorted so two callers locking the
   * same pair can never deadlock.
   */
  async lockResources(keys: string[]): Promise<void> {
    for (const key of [...new Set(keys)].sort()) {
      await this.database.db.execute(
        sql`select pg_advisory_xact_lock(hashtext(${key}))`,
      );
    }
  }

  /** An active appointment overlapping [startAt, endAt) for this stylist or chair. */
  findConflict(
    salonId: string,
    input: {
      stylistId: string;
      chairId?: string | null;
      startAt: Date;
      endAt: Date;
      excludeId?: string;
    },
  ): Promise<AppointmentRow | undefined> {
    return this.database.db.query.appointments.findFirst({
      where: and(
        eq(appointments.salonId, salonId),
        inArray(appointments.status, ACTIVE_STATUSES),
        lt(appointments.startAt, input.endAt),
        gt(appointments.endAt, input.startAt),
        isNull(appointments.deletedAt),
        input.excludeId ? ne(appointments.id, input.excludeId) : undefined,
        input.chairId
          ? or(
              eq(appointments.stylistId, input.stylistId),
              eq(appointments.chairId, input.chairId),
            )
          : eq(appointments.stylistId, input.stylistId),
      ),
    });
  }

  async create(input: {
    salonId: string;
    branchId: string;
    stylistId: string;
    chairId: string | null;
    customerId: string | null;
    serviceIds: string[];
    addOnIds: string[];
    startAt: Date;
    endAt: Date;
    notes: string | null;
  }): Promise<AppointmentRow> {
    const [row] = await this.database.db
      .insert(appointments)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: AppointmentPatch,
  ): Promise<AppointmentRow | undefined> {
    const [row] = await this.database.db
      .update(appointments)
      .set(patch)
      .where(and(eq(appointments.id, id), eq(appointments.salonId, salonId)))
      .returning();
    return row;
  }
}

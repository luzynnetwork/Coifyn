import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import {
  appointments,
  customerNotes,
  cutRecords,
  tickets,
} from '../../persistence/schema/index.js';

export interface TimelineItem {
  kind: 'visit' | 'appointment' | 'no_show' | 'cut_record' | 'note';
  at: Date;
  refId: string;
  summary: string;
  detail?: Record<string, unknown>;
}

/** Read-only assembly of everything that happened to one customer. */
@Injectable()
export class CustomerTimelineRepo {
  constructor(private readonly database: DatabaseService) {}

  async build(
    salonId: string,
    customerId: string,
    opts: { includeCutRecords: boolean },
  ): Promise<TimelineItem[]> {
    const db = this.database.db;
    const [paid, appts, notes, cuts] = await Promise.all([
      db.query.tickets.findMany({
        where: and(
          eq(tickets.salonId, salonId),
          eq(tickets.customerId, customerId),
          eq(tickets.status, 'paid'),
        ),
        orderBy: desc(tickets.createdAt),
        limit: 100,
      }),
      db.query.appointments.findMany({
        where: and(
          eq(appointments.salonId, salonId),
          eq(appointments.customerId, customerId),
          inArray(appointments.status, ['completed', 'no_show', 'cancelled']),
          isNull(appointments.deletedAt),
        ),
        orderBy: desc(appointments.startAt),
        limit: 100,
      }),
      db.query.customerNotes.findMany({
        where: and(
          eq(customerNotes.salonId, salonId),
          eq(customerNotes.customerId, customerId),
        ),
        limit: 100,
      }),
      opts.includeCutRecords
        ? db.query.cutRecords.findMany({
            where: and(
              eq(cutRecords.salonId, salonId),
              eq(cutRecords.customerId, customerId),
            ),
            limit: 100,
          })
        : Promise.resolve([]),
    ]);

    const items: TimelineItem[] = [
      ...paid.map((t) => ({
        kind: 'visit' as const,
        at: t.paidAt ?? t.createdAt,
        refId: t.id,
        summary: 'Paid visit',
        detail: { totalMinor: t.totalMinor },
      })),
      ...appts.map((a) => ({
        kind: (a.status === 'no_show' ? 'no_show' : 'appointment') as
          | 'no_show'
          | 'appointment',
        at: a.startAt,
        refId: a.id,
        summary: `Appointment ${a.status}`,
        detail: {
          stylistId: a.stylistId,
          originalStylistId: a.originalStylistId,
        },
      })),
      ...notes.map((n) => ({
        kind: 'note' as const,
        at: n.createdAt,
        refId: n.id,
        summary: n.body,
      })),
      ...cuts.map((c) => ({
        kind: 'cut_record' as const,
        at: c.createdAt,
        refId: c.id,
        summary: c.fadeType ? `Cut — ${c.fadeType}` : 'Cut recorded',
        detail: { stylistId: c.stylistId },
      })),
    ];
    return items.sort((a, b) => b.at.getTime() - a.at.getTime());
  }
}

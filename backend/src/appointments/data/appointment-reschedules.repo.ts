import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { appointmentReschedules } from '../../persistence/schema/index.js';

/** Insert-only history of an appointment being moved. */
@Injectable()
export class AppointmentReschedulesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForAppointment(appointmentId: string) {
    return this.database.db.query.appointmentReschedules.findMany({
      where: eq(appointmentReschedules.appointmentId, appointmentId),
      orderBy: desc(appointmentReschedules.createdAt),
    });
  }

  async append(input: {
    salonId: string;
    appointmentId: string;
    fromStartAt: Date;
    fromEndAt: Date;
    toStartAt: Date;
    toEndAt: Date;
    rescheduledBy: string;
    reason: string | null;
  }) {
    const [row] = await this.database.db
      .insert(appointmentReschedules)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }
}

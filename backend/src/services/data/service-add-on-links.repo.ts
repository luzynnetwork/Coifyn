import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { serviceAddOnLinks } from '../../persistence/schema/index.js';

export type ServiceAddOnLinkRow = typeof serviceAddOnLinks.$inferSelect;

@Injectable()
export class ServiceAddOnLinksRepo {
  constructor(private readonly database: DatabaseService) {}

  listForService(serviceId: string): Promise<ServiceAddOnLinkRow[]> {
    return this.database.db.query.serviceAddOnLinks.findMany({
      where: eq(serviceAddOnLinks.serviceId, serviceId),
    });
  }

  /** Replaces the full set of add-ons linked to a service. */
  async replaceForService(
    salonId: string,
    serviceId: string,
    addOnIds: string[],
  ): Promise<void> {
    await this.database.db
      .delete(serviceAddOnLinks)
      .where(eq(serviceAddOnLinks.serviceId, serviceId));
    if (addOnIds.length === 0) return;
    await this.database.db.insert(serviceAddOnLinks).values(
      addOnIds.map((addOnId) => ({
        id: uuidv7(),
        salonId,
        serviceId,
        addOnId,
      })),
    );
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServiceAddOnsRepo } from '../../services/data/service-add-ons.repo.js';
import { ServicesRepo } from '../../services/data/services.repo.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { StylistServicesRepo } from '../../stylists/data/stylist-services.repo.js';
import { TicketLinesRepo } from '../data/ticket-lines.repo.js';
import type { AddTicketLineDto } from '../dto/ticket.dto.js';
import { RecomputeTicket } from './recompute-ticket.js';
import { RequireTicket } from './require-ticket.js';

@Injectable()
export class AddTicketLine {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly requireTicket: RequireTicket,
    private readonly services: ServicesRepo,
    private readonly addOns: ServiceAddOnsRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly stylistServices: StylistServicesRepo,
    private readonly lines: TicketLinesRepo,
    private readonly recompute: RecomputeTicket,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, ticketId: string, dto: AddTicketLineDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const ticket = await this.requireTicket.execute(
        user,
        salonId,
        ticketId,
        'pos:operate',
        { openOnly: true },
      );

      if (dto.stylistId && !(await this.stylists.findById(salonId, dto.stylistId))) {
        throw new BadRequestException('Unknown stylist.');
      }

      let description: string;
      let unitPriceMinor: number;

      if (dto.kind === 'service') {
        const service = await this.services.findById(salonId, dto.refId);
        if (!service || !service.isActive) {
          throw new BadRequestException('Unknown or inactive service.');
        }
        description = service.name;
        unitPriceMinor = service.basePriceMinor;

        if (dto.stylistId) {
          const links = await this.stylistServices.listForStylist(dto.stylistId);
          const link = links.find((l) => l.serviceId === service.id);
          if (link && !link.canPerform) {
            throw new BadRequestException('That stylist does not perform this service.');
          }
          // A per-stylist price beats the menu price.
          if (link?.priceOverrideMinor != null) {
            unitPriceMinor = link.priceOverrideMinor;
          }
        }
      } else {
        const addOn = await this.addOns.findById(salonId, dto.refId);
        if (!addOn) throw new BadRequestException('Unknown add-on.');
        description = addOn.name;
        unitPriceMinor = addOn.priceMinor;
      }

      const line = await this.lines.create({
        salonId,
        ticketId,
        kind: dto.kind,
        refId: dto.refId,
        stylistId: dto.stylistId ?? null,
        description,
        qty: dto.qty ?? 1,
        unitPriceMinor,
      });
      const updated = await this.recompute.execute(salonId, ticket);

      await this.events.emit({
        aggregateType: 'ticket',
        aggregateId: ticketId,
        type: 'TicketLineAdded',
        salonId,
        payload: { ticketId, lineId: line.id },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'ticket.line_added',
        targetType: 'ticket',
        targetId: ticketId,
        after: { description, unitPriceMinor, qty: line.qty },
      });
      return { ticket: updated, line };
    });
  }
}

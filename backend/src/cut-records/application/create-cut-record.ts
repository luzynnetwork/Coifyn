import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentsRepo } from '../../appointments/data/appointments.repo.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { CutRecordsRepo } from '../data/cut-records.repo.js';
import type { CreateCutRecordDto } from '../dto/cut-record.dto.js';

/** Captures the cut at checkout. The serving stylist is the caller's own
 *  profile unless stated; a stand-in is credited as the author, while the
 *  appointment keeps pointing at the stylist the customer chose. */
@Injectable()
export class CreateCutRecord {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly records: CutRecordsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, dto: CreateCutRecordDto) {
    return this.scope.run(user, async (salonId) => {
      if (!(await this.customers.findById(salonId, dto.customerId))) {
        throw new NotFoundException('Customer not found.');
      }
      const appt = dto.appointmentId
        ? await this.appointments.findById(salonId, dto.appointmentId)
        : undefined;
      if (dto.appointmentId && !appt) {
        throw new NotFoundException('Appointment not found.');
      }

      const stylistId =
        dto.stylistId ??
        (await this.stylists.findByUserId(salonId, user.id))?.id ??
        appt?.stylistId;
      if (!stylistId) {
        throw new BadRequestException('Say which stylist performed the cut.');
      }
      const stylist = await this.stylists.findById(salonId, stylistId);
      if (!stylist) throw new BadRequestException('Unknown stylist.');
      await this.authorize.check(user, 'cutrecord:manage', {
        salonId,
        branchId: stylist.branchId,
      });

      const row = await this.records.create({
        salonId,
        customerId: dto.customerId,
        stylistId,
        appointmentId: dto.appointmentId ?? null,
        ticketId: dto.ticketId ?? null,
        serviceIds: dto.serviceIds ?? (appt?.serviceIds as string[]) ?? [],
        clipperGuards: dto.clipperGuards ?? {},
        fadeType: dto.fadeType ?? null,
        partingNotes: dto.partingNotes ?? null,
        beardNotes: dto.beardNotes ?? null,
        productsUsed: dto.productsUsed ?? [],
        freeText: dto.freeText ?? null,
      });
      await this.events.emit({
        aggregateType: 'cut_record',
        aggregateId: row.id,
        type: 'CutRecordCreated',
        salonId,
        payload: { cutRecordId: row.id, customerId: dto.customerId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'cut_record.created',
        targetType: 'cut_record',
        targetId: row.id,
        after: { customerId: dto.customerId, stylistId },
      });
      return row;
    });
  }
}

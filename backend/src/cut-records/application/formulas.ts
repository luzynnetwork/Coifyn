import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { FormulaEntriesRepo } from '../data/formula-entries.repo.js';
import type { CreateFormulaDto, UpdateFormulaDto } from '../dto/cut-record.dto.js';

/** Colour / perm / treatment formulas — list, add and amend. */
@Injectable()
export class Formulas {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly formulas: FormulaEntriesRepo,
    private readonly events: EventBus,
  ) {}

  list(user: AuthUser, customerId: string) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'cutrecord:view', { salonId });
      if (!(await this.customers.findById(salonId, customerId))) {
        throw new NotFoundException('Customer not found.');
      }
      return this.formulas.listForCustomer(salonId, customerId);
    });
  }

  create(user: AuthUser, dto: CreateFormulaDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'cutrecord:manage', { salonId });
      if (!(await this.customers.findById(salonId, dto.customerId))) {
        throw new NotFoundException('Customer not found.');
      }
      const stylist = await this.stylists.findByUserId(salonId, user.id);
      const row = await this.formulas.create({
        salonId,
        customerId: dto.customerId,
        stylistId: stylist?.id ?? null,
        kind: dto.kind,
        formula: dto.formula,
        developer: dto.developer ?? null,
        processingMin: dto.processingMin ?? null,
        notes: dto.notes ?? null,
      });
      await this.events.emit({
        aggregateType: 'formula_entry',
        aggregateId: row.id,
        type: 'FormulaEntryCreated',
        salonId,
        payload: { formulaId: row.id, customerId: dto.customerId },
      });
      return row;
    });
  }

  update(user: AuthUser, id: string, dto: UpdateFormulaDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'cutrecord:manage', { salonId });
      const existing = await this.formulas.findById(salonId, id);
      if (!existing) throw new NotFoundException('Formula not found.');
      return (await this.formulas.update(salonId, id, { ...dto })) ?? existing;
    });
  }
}

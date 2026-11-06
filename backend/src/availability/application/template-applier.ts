import { Injectable } from '@nestjs/common';
import { ShiftsRepo } from '../data/shifts.repo.js';
import type { ShiftTemplateRow } from '../data/shift-templates.repo.js';
import { expandTemplate, type PatternEntry } from '../domain/expand-template.js';

/** Materialises a template into shifts for a date range. Idempotent: a shift
 *  already present (or overlapping one the stylist has) is skipped, so applying
 *  the same range twice creates nothing the second time. */
@Injectable()
export class TemplateApplier {
  constructor(private readonly shifts: ShiftsRepo) {}

  async apply(
    salonId: string,
    template: ShiftTemplateRow,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<number> {
    let created = 0;
    for (const planned of expandTemplate(
      template.pattern as PatternEntry[],
      from,
      to,
      timeZone,
    )) {
      if (
        await this.shifts.findOverlap(
          salonId,
          template.stylistId,
          planned.startAt,
          planned.endAt,
        )
      ) {
        continue;
      }
      await this.shifts.create({
        salonId,
        stylistId: template.stylistId,
        branchId: template.branchId,
        startAt: planned.startAt,
        endAt: planned.endAt,
        chairId: template.chairId,
        templateId: template.id,
      });
      created++;
    }
    return created;
  }
}

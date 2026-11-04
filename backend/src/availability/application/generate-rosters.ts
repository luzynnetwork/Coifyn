import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { ShiftTemplatesRepo } from '../data/shift-templates.repo.js';
import { TemplateApplier } from './template-applier.js';

const HORIZON_DAYS = 28;

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** The `roster-generator` job: keeps every template materialised a rolling
 *  28 days ahead. System scope — it deliberately spans all salons. */
@Injectable()
export class GenerateRosters {
  constructor(
    private readonly database: DatabaseService,
    private readonly templates: ShiftTemplatesRepo,
    private readonly salons: SalonsRepo,
    private readonly applier: TemplateApplier,
  ) {}

  execute(now = new Date()): Promise<{ created: number }> {
    return this.database.withSystem(async () => {
      const end = new Date(now.getTime() + HORIZON_DAYS * 24 * 3600 * 1000);
      let created = 0;
      for (const template of await this.templates.listAll()) {
        const tz = (await this.salons.findById(template.salonId))?.timezone ?? 'UTC';
        created += await this.applier.apply(
          template.salonId,
          template,
          ymd(now),
          ymd(end),
          tz,
        );
      }
      return { created };
    });
  }
}

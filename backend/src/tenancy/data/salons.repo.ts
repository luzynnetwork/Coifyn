import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import { salonOrganizations } from '../../persistence/schema/index.js';

export type SalonRow = typeof salonOrganizations.$inferSelect;

@Injectable()
export class SalonsRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(id: string): Promise<SalonRow | undefined> {
    return this.database.db.query.salonOrganizations.findFirst({
      where: eq(salonOrganizations.id, id),
    });
  }

  findBySlug(slug: string): Promise<SalonRow | undefined> {
    return this.database.db.query.salonOrganizations.findFirst({
      where: eq(salonOrganizations.slug, slug),
    });
  }

  async create(input: {
    id: string;
    slug: string;
    legalName: string;
    brandName: string;
    currency: string;
    timezone: string;
  }): Promise<SalonRow> {
    const [row] = await this.database.db
      .insert(salonOrganizations)
      .values(input)
      .returning();
    return row;
  }

  async update(
    id: string,
    patch: Partial<
      Pick<
        SalonRow,
        'brandName' | 'legalName' | 'currency' | 'timezone' | 'taxProfile'
      >
    >,
  ): Promise<SalonRow | undefined> {
    const [row] = await this.database.db
      .update(salonOrganizations)
      .set(patch)
      .where(eq(salonOrganizations.id, id))
      .returning();
    return row;
  }
}

/** URL-safe slug from a salon name, plus a short random suffix so two salons
 *  called "Fade Room" don't collide. */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'salon';
  return `${base}-${randomBytes(3).toString('hex')}`;
}

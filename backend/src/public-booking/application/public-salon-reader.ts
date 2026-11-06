import { Injectable, NotFoundException } from '@nestjs/common';
import { SlotFinder } from '../../availability/application/slot-finder.js';
import { ServicesRepo } from '../../services/data/services.repo.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';

const LOOKAHEAD_DAYS = 7;

/** Local YYYY-MM-DD for an instant in the salon's timezone. */
export const localDate = (at: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone }).format(at);

/** Reads a salon by its public slug. Must be called inside `withSystem`. */
@Injectable()
export class PublicSalonReader {
  constructor(
    private readonly salons: SalonsRepo,
    private readonly branches: BranchesRepo,
    private readonly services: ServicesRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly slots: SlotFinder,
  ) {}

  async resolve(slug: string) {
    const salon = await this.salons.findBySlug(slug);
    if (!salon || salon.status !== 'active') {
      throw new NotFoundException('Salon not found.');
    }
    return salon;
  }

  async page(slug: string) {
    const salon = await this.resolve(slug);
    const [branches, allServices, allStylists] = await Promise.all([
      this.branches.listForSalon(salon.id),
      this.services.listForSalon(salon.id),
      this.stylists.listForSalon(salon.id),
    ]);
    const services = allServices.filter((s) => s.isActive && s.isBookable);
    const cheapest = [...services].sort((a, b) => a.baseDurationMin - b.baseDurationMin)[0];

    const stylists = [];
    for (const s of allStylists.filter((x) => x.isBookable)) {
      stylists.push({
        id: s.id,
        branchId: s.branchId,
        displayName: s.displayName,
        bio: s.bio,
        avatarUrl: s.avatarUrl,
        specialties: s.specialties,
        status: s.status,
        nextSlot: cheapest ? await this.nextSlot(salon, s.id, cheapest.id) : null,
      });
    }

    return {
      salon: { slug: salon.slug, brandName: salon.brandName, timezone: salon.timezone },
      branches: branches.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name })),
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        basePriceMinor: s.basePriceMinor,
        baseDurationMin: s.baseDurationMin,
      })),
      stylists,
    };
  }

  private async nextSlot(
    salon: { id: string; timezone: string },
    stylistId: string,
    serviceId: string,
  ): Promise<string | null> {
    const base = new Date();
    for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
      const date = localDate(new Date(base.getTime() + i * 86400000), salon.timezone);
      const open = await this.slots
        .find({ salonId: salon.id, stylistId, serviceIds: [serviceId], date })
        .catch(() => []);
      if (open.length > 0) return open[0].startAt.toISOString();
    }
    return null;
  }
}

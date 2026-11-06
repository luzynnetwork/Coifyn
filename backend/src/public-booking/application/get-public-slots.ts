import { Injectable, NotFoundException } from '@nestjs/common';
import { SlotFinder } from '../../availability/application/slot-finder.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { PublicSalonReader } from './public-salon-reader.js';

@Injectable()
export class GetPublicSlots {
  constructor(
    private readonly database: DatabaseService,
    private readonly reader: PublicSalonReader,
    private readonly stylists: StylistProfilesRepo,
    private readonly finder: SlotFinder,
  ) {}

  execute(slug: string, stylistId: string, serviceIds: string[], date: string) {
    return this.database.withSystem(async () => {
      const salon = await this.reader.resolve(slug);
      const stylist = await this.stylists.findById(salon.id, stylistId);
      if (!stylist || !stylist.isBookable) {
        throw new NotFoundException('Stylist not found.');
      }
      const slots = await this.finder.find({
        salonId: salon.id,
        stylistId,
        serviceIds,
        date,
      });
      return slots.map((s) => ({
        startAt: s.startAt.toISOString(),
        endAt: s.endAt.toISOString(),
      }));
    });
  }
}

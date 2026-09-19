import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { ChairsRepo } from '../../tenancy/data/chairs.repo.js';
import type { AssignQueueEntryDto } from '../dto/queue.dto.js';
import { QueueTransitioner } from './queue-transitioner.js';

@Injectable()
export class AssignQueueEntry {
  constructor(
    private readonly transitioner: QueueTransitioner,
    private readonly stylists: StylistProfilesRepo,
    private readonly chairs: ChairsRepo,
  ) {}

  execute(user: AuthUser, id: string, dto: AssignQueueEntryDto) {
    return this.transitioner.execute(user, id, {
      from: ['waiting'],
      to: 'assigned',
      eventType: 'QueueAssigned',
      action: 'queue.assigned',
      prepare: async (entry, salonId) => {
        const stylist = await this.stylists.findById(salonId, dto.stylistId);
        if (!stylist) throw new BadRequestException('Unknown stylist.');

        const chair = await this.chairs.findById(salonId, dto.chairId);
        if (!chair || chair.branchId !== entry.branchId || !chair.isActive) {
          throw new BadRequestException(
            'Chair must be an active chair in this branch.',
          );
        }
        return {
          assignedStylistId: dto.stylistId,
          assignedChairId: dto.chairId,
          calledAt: new Date(),
        };
      },
    });
  }
}

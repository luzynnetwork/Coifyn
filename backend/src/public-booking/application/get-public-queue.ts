import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { QueueBoardBuilder } from '../../queue/application/queue-board-builder.js';
import { PublicLookupRepo } from '../data/public-lookup.repo.js';

/** The public wait board: per stylist status, how many are waiting and the
 *  estimated wait. Customer names and ids are deliberately left out. */
@Injectable()
export class GetPublicQueue {
  constructor(
    private readonly database: DatabaseService,
    private readonly lookup: PublicLookupRepo,
    private readonly builder: QueueBoardBuilder,
  ) {}

  execute(branchId: string) {
    return this.database.withSystem(async () => {
      const branch = await this.lookup.findActiveBranch(branchId);
      if (!branch) throw new NotFoundException('Branch not found.');
      const board = await this.builder.build(branch.salonId, branch.id);
      return {
        branchId: branch.id,
        branchName: branch.name,
        at: board.at,
        lanes: board.lanes.map((l) => ({
          stylistId: l.stylistId,
          displayName: l.displayName,
          status: l.status,
          busy: !!l.inService,
          waitingCount: l.waitingCount,
          estimatedMinutes: l.estimatedMinutes,
        })),
      };
    });
  }
}

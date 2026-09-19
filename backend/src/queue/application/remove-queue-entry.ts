import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import type { RemoveQueueEntryDto } from '../dto/queue.dto.js';
import { QueueTransitioner } from './queue-transitioner.js';

/** A walk-in leaves or no-shows before service starts. */
@Injectable()
export class RemoveQueueEntry {
  constructor(private readonly transitioner: QueueTransitioner) {}

  execute(user: AuthUser, id: string, dto: RemoveQueueEntryDto) {
    return this.transitioner.execute(user, id, {
      from: ['waiting', 'assigned'],
      to: 'left',
      eventType: 'QueueLeft',
      action: 'queue.left',
      reason: dto.reason,
    });
  }
}

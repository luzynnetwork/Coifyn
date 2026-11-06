import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { QueueTransitioner } from './queue-transitioner.js';

@Injectable()
export class CompleteQueueEntry {
  constructor(private readonly transitioner: QueueTransitioner) {}

  execute(user: AuthUser, id: string) {
    return this.transitioner.execute(user, id, {
      from: ['in_service'],
      to: 'done',
      eventType: 'QueueCompleted',
      action: 'queue.completed',
      prepare: async () => ({ completedAt: new Date() }),
    });
  }
}

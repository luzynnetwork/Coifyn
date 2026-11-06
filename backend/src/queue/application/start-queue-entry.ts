import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { QueueTransitioner } from './queue-transitioner.js';

@Injectable()
export class StartQueueEntry {
  constructor(private readonly transitioner: QueueTransitioner) {}

  execute(user: AuthUser, id: string) {
    return this.transitioner.execute(user, id, {
      from: ['assigned'],
      to: 'in_service',
      eventType: 'QueueServiceStarted',
      action: 'queue.service_started',
      prepare: async () => ({ startedAt: new Date() }),
    });
  }
}

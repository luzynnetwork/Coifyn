import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DeclareDisruption } from './declare-disruption.js';

/** `POST /stylists/:id/running-late` — shorthand for a running_late disruption. */
@Injectable()
export class DeclareRunningLate {
  constructor(private readonly declare: DeclareDisruption) {}

  execute(user: AuthUser, stylistId: string, minutes: number) {
    return this.declare.execute(user, {
      stylistId,
      kind: 'running_late',
      minutesLate: minutes,
    });
  }
}

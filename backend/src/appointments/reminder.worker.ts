import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { backgroundWorkersEnabled } from '../common/background-worker.js';
import { SendAppointmentReminders } from './application/send-appointment-reminders.js';

const INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class ReminderWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ReminderWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly reminders: SendAppointmentReminders) {}

  onApplicationBootstrap(): void {
    if (!backgroundWorkersEnabled()) return;
    this.timer = setInterval(() => {
      this.reminders
        .execute()
        .catch((err) => this.logger.error({ err }, 'appointment reminders failed'));
    }, INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}

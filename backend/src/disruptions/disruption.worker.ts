import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { backgroundWorkersEnabled } from '../common/background-worker.js';
import { EscalateStaleOffers } from './application/escalate-stale-offers.js';

const INTERVAL_MS = 60 * 1000;

@Injectable()
export class DisruptionWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DisruptionWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly escalate: EscalateStaleOffers) {}

  onApplicationBootstrap(): void {
    if (!backgroundWorkersEnabled()) return;
    this.timer = setInterval(() => {
      this.escalate
        .execute()
        .catch((err) => this.logger.error({ err }, 'offer escalation failed'));
    }, INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}

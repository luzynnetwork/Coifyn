import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { backgroundWorkersEnabled } from '../common/background-worker.js';
import { ExpirePoints } from './application/expire-points.js';

const INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class LoyaltyWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(LoyaltyWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly expire: ExpirePoints) {}

  onApplicationBootstrap(): void {
    if (!backgroundWorkersEnabled()) return;
    this.timer = setInterval(() => {
      this.expire
        .execute()
        .catch((err) => this.logger.error({ err }, 'loyalty expiry failed'));
    }, INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}

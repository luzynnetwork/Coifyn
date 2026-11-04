import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { backgroundWorkersEnabled } from '../common/background-worker.js';
import { GenerateRosters } from './application/generate-rosters.js';

const INTERVAL_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class RosterWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(RosterWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly generate: GenerateRosters) {}

  onApplicationBootstrap(): void {
    if (!backgroundWorkersEnabled()) return;
    const run = () =>
      this.generate
        .execute()
        .catch((err) => this.logger.error({ err }, 'roster generation failed'));
    void run();
    this.timer = setInterval(run, INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}

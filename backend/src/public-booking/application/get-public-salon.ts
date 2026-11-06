import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { PublicSalonReader } from './public-salon-reader.js';

/** The customer app's read-only salon page: services, stylists, each stylist's
 *  live status and next open slot. No account needed. */
@Injectable()
export class GetPublicSalon {
  constructor(
    private readonly database: DatabaseService,
    private readonly reader: PublicSalonReader,
  ) {}

  execute(slug: string) {
    return this.database.withSystem(() => this.reader.page(slug));
  }
}

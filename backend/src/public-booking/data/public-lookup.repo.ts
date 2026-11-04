import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import { branches } from '../../persistence/schema/index.js';

/** Unauthenticated lookups for the public customer pages. Every call must run
 *  inside `database.withSystem` — there is no user to scope by. */
@Injectable()
export class PublicLookupRepo {
  constructor(private readonly database: DatabaseService) {}

  findActiveBranch(id: string) {
    return this.database.db.query.branches.findFirst({
      where: and(
        eq(branches.id, id),
        eq(branches.isActive, true),
        isNull(branches.deletedAt),
      ),
    });
  }
}

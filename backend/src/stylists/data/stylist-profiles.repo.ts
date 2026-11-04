import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { stylistProfiles } from '../../persistence/schema/index.js';

export type StylistProfileRow = typeof stylistProfiles.$inferSelect;

@Injectable()
export class StylistProfilesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForSalon(salonId: string): Promise<StylistProfileRow[]> {
    return this.database.db.query.stylistProfiles.findMany({
      where: and(
        eq(stylistProfiles.salonId, salonId),
        isNull(stylistProfiles.deletedAt),
      ),
    });
  }

  findById(salonId: string, id: string): Promise<StylistProfileRow | undefined> {
    return this.database.db.query.stylistProfiles.findFirst({
      where: and(
        eq(stylistProfiles.id, id),
        eq(stylistProfiles.salonId, salonId),
        isNull(stylistProfiles.deletedAt),
      ),
    });
  }

  findByUserId(
    salonId: string,
    userId: string,
  ): Promise<StylistProfileRow | undefined> {
    return this.database.db.query.stylistProfiles.findFirst({
      where: and(
        eq(stylistProfiles.salonId, salonId),
        eq(stylistProfiles.userId, userId),
        isNull(stylistProfiles.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    userId: string;
    branchId: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    specialties: string[];
    isBookable: boolean;
    startedAt: Date | null;
  }): Promise<StylistProfileRow> {
    const [row] = await this.database.db
      .insert(stylistProfiles)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<
      Pick<
        StylistProfileRow,
        | 'branchId'
        | 'displayName'
        | 'bio'
        | 'avatarUrl'
        | 'specialties'
        | 'isBookable'
        | 'startedAt'
        | 'status'
      >
    >,
  ): Promise<StylistProfileRow | undefined> {
    const [row] = await this.database.db
      .update(stylistProfiles)
      .set(patch)
      .where(and(eq(stylistProfiles.id, id), eq(stylistProfiles.salonId, salonId)))
      .returning();
    return row;
  }
}

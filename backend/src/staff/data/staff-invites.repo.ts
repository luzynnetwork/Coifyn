import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { staffInvites } from '../../persistence/schema/index.js';

export type StaffInviteRow = typeof staffInvites.$inferSelect;

@Injectable()
export class StaffInvitesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForSalon(salonId: string): Promise<StaffInviteRow[]> {
    return this.database.db.query.staffInvites.findMany({
      where: eq(staffInvites.salonId, salonId),
    });
  }

  findById(salonId: string, id: string): Promise<StaffInviteRow | undefined> {
    return this.database.db.query.staffInvites.findFirst({
      where: and(eq(staffInvites.id, id), eq(staffInvites.salonId, salonId)),
    });
  }

  /** Cross-tenant lookup — call inside `database.withSystem()`. Used by the
   *  public accept-flow, which has no salon/identity yet. */
  findByToken(token: string): Promise<StaffInviteRow | undefined> {
    return this.database.db.query.staffInvites.findFirst({
      where: eq(staffInvites.token, token),
    });
  }

  async create(input: {
    salonId: string;
    email: string;
    roleId: string;
    branchIds: string[];
    token: string;
    expiresAt: Date;
  }): Promise<StaffInviteRow> {
    const [row] = await this.database.db
      .insert(staffInvites)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async setStatus(
    id: string,
    status: 'pending' | 'accepted' | 'revoked' | 'expired',
  ): Promise<StaffInviteRow | undefined> {
    const [row] = await this.database.db
      .update(staffInvites)
      .set({ status })
      .where(eq(staffInvites.id, id))
      .returning();
    return row;
  }
}

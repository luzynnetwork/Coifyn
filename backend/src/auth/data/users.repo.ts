import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { users } from '../../persistence/schema/index.js';

export type UserRow = typeof users.$inferSelect;

@Injectable()
export class UsersRepo {
  constructor(private readonly database: DatabaseService) {}

  findByEmail(email: string): Promise<UserRow | undefined> {
    return this.database.db.query.users
      .findFirst({ where: eq(users.email, email.toLowerCase()) });
  }

  findById(id: string): Promise<UserRow | undefined> {
    return this.database.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<UserRow> {
    const [row] = await this.database.db
      .insert(users)
      .values({
        id: uuidv7(),
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        displayName: input.displayName,
      })
      .returning();
    return row;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.database.db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, id));
  }

  async updateProfile(
    id: string,
    patch: Partial<Pick<UserRow, 'displayName'>>,
  ): Promise<UserRow | undefined> {
    const [row] = await this.database.db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();
    return row;
  }

  /** Enables/disables login — used by the `staff` module's deactivate flow.
   *  `user` carries no salon FK (Phase 1 staff belong to exactly one salon), so
   *  disabling here is what "deactivate this staff member" means today. */
  async setStatus(
    id: string,
    status: 'active' | 'disabled',
  ): Promise<UserRow | undefined> {
    const [row] = await this.database.db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return row;
  }
}

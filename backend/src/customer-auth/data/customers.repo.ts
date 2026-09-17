import { Injectable } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { customers } from '../../persistence/schema/index.js';

export type CustomerRow = typeof customers.$inferSelect;

@Injectable()
export class CustomersRepo {
  constructor(private readonly database: DatabaseService) {}

  findByEmail(email: string): Promise<CustomerRow | undefined> {
    return this.database.db.query.customers.findFirst({
      where: eq(customers.email, email.toLowerCase()),
    });
  }

  findByPhone(phone: string): Promise<CustomerRow | undefined> {
    return this.database.db.query.customers.findFirst({
      where: eq(customers.phone, phone),
    });
  }

  /** Login accepts either identifier in one field. */
  findByEmailOrPhone(identifier: string): Promise<CustomerRow | undefined> {
    const normalized = identifier.toLowerCase();
    return this.database.db.query.customers.findFirst({
      where: or(
        eq(customers.email, normalized),
        eq(customers.phone, identifier),
      ),
    });
  }

  findById(id: string): Promise<CustomerRow | undefined> {
    return this.database.db.query.customers.findFirst({
      where: eq(customers.id, id),
    });
  }

  async create(input: {
    email: string | null;
    phone: string | null;
    passwordHash: string;
    displayName: string;
  }): Promise<CustomerRow> {
    const [row] = await this.database.db
      .insert(customers)
      .values({
        id: uuidv7(),
        email: input.email?.toLowerCase() ?? null,
        phone: input.phone,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
      })
      .returning();
    return row;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.database.db
      .update(customers)
      .set({ passwordHash })
      .where(eq(customers.id, id));
  }

  async markVerified(id: string): Promise<void> {
    await this.database.db
      .update(customers)
      .set({ verifiedAt: new Date() })
      .where(eq(customers.id, id));
  }

  async updateProfile(
    id: string,
    patch: Partial<Pick<CustomerRow, 'displayName'>>,
  ): Promise<CustomerRow | undefined> {
    const [row] = await this.database.db
      .update(customers)
      .set(patch)
      .where(eq(customers.id, id))
      .returning();
    return row;
  }
}

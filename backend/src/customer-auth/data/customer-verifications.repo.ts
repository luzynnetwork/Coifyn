import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { customerVerifications } from '../../persistence/schema/index.js';

export type CustomerVerificationRow =
  typeof customerVerifications.$inferSelect;
export type VerificationPurpose = 'verify_account' | 'password_reset';

@Injectable()
export class CustomerVerificationsRepo {
  constructor(private readonly database: DatabaseService) {}

  async create(input: {
    customerId: string;
    purpose: VerificationPurpose;
    codeHash: string;
    expiresAt: Date;
  }): Promise<CustomerVerificationRow> {
    const [row] = await this.database.db
      .insert(customerVerifications)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  /** An unconsumed, unexpired code for this customer + purpose + code hash. */
  findValid(
    customerId: string,
    purpose: VerificationPurpose,
    codeHash: string,
  ): Promise<CustomerVerificationRow | undefined> {
    return this.database.db.query.customerVerifications.findFirst({
      where: and(
        eq(customerVerifications.customerId, customerId),
        eq(customerVerifications.purpose, purpose),
        eq(customerVerifications.codeHash, codeHash),
        isNull(customerVerifications.consumedAt),
        gt(customerVerifications.expiresAt, new Date()),
      ),
    });
  }

  async consume(id: string): Promise<void> {
    await this.database.db
      .update(customerVerifications)
      .set({ consumedAt: new Date() })
      .where(eq(customerVerifications.id, id));
  }

  /** Consume every outstanding code for a customer + purpose — called when a
   *  new one is requested and after a successful use, so a code is never
   *  reusable and old codes can't linger. */
  async invalidateAllFor(
    customerId: string,
    purpose: VerificationPurpose,
  ): Promise<void> {
    await this.database.db
      .update(customerVerifications)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(customerVerifications.customerId, customerId),
          eq(customerVerifications.purpose, purpose),
          isNull(customerVerifications.consumedAt),
        ),
      );
  }
}

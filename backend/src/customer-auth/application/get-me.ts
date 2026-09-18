import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { AuthCustomer } from '../customer.js';

export interface CustomerMeView {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  status: string;
  verifiedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class GetMeCustomer {
  constructor(
    private readonly database: DatabaseService,
    private readonly customers: CustomersRepo,
  ) {}

  async execute(customer: AuthCustomer): Promise<CustomerMeView> {
    const row = await this.database.withAnon(() =>
      this.customers.findById(customer.id),
    );
    if (!row) throw new NotFoundException('Account not found.');
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      displayName: row.displayName,
      status: row.status,
      verifiedAt: row.verifiedAt,
      createdAt: row.createdAt,
    };
  }
}

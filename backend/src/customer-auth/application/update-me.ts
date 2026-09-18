import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { AuthCustomer } from '../customer.js';
import { UpdateMeCustomerDto } from '../dto/customer-auth.dto.js';
import { CustomerMeView, GetMeCustomer } from './get-me.js';

@Injectable()
export class UpdateMeCustomer {
  constructor(
    private readonly database: DatabaseService,
    private readonly customers: CustomersRepo,
    private readonly getMe: GetMeCustomer,
  ) {}

  async execute(
    customer: AuthCustomer,
    dto: UpdateMeCustomerDto,
  ): Promise<CustomerMeView> {
    const patch =
      dto.displayName !== undefined ? { displayName: dto.displayName } : {};
    const row = await this.database.withAnon(() =>
      this.customers.updateProfile(customer.id, patch),
    );
    if (!row) throw new NotFoundException('Account not found.');
    return this.getMe.execute(customer);
  }
}

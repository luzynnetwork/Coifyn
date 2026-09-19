import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { CustomersController } from './customers.controller.js';
import { CustomersRepo } from './data/customers.repo.js';
import { ListCustomers } from './application/list-customers.js';
import { GetCustomer } from './application/get-customer.js';
import { CreateCustomer } from './application/create-customer.js';
import { UpdateCustomer } from './application/update-customer.js';
import { ListCustomerVisits } from './application/list-customer-visits.js';

/** Phase 1: a salon's client records. Exports CustomersRepo so payments can
 *  call recordVisit() inside the payment transaction. */
@Module({
  imports: [AuthModule, RbacModule],
  controllers: [CustomersController],
  providers: [
    CustomersRepo,
    ListCustomers,
    GetCustomer,
    CreateCustomer,
    UpdateCustomer,
    ListCustomerVisits,
  ],
  exports: [CustomersRepo],
})
export class CustomersModule {}

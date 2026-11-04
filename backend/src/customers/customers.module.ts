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
import { CustomerPreferencesRepo } from './data/customer-preferences.repo.js';
import { CustomerTagsRepo } from './data/customer-tags.repo.js';
import { CustomerNotesRepo } from './data/customer-notes.repo.js';
import { CommunicationConsentsRepo } from './data/communication-consents.repo.js';
import { CustomerTimelineRepo } from './data/customer-timeline.repo.js';
import { CustomerMergeRepo } from './data/customer-merge.repo.js';
import { GetPreferences } from './application/get-preferences.js';
import { UpdatePreferences } from './application/update-preferences.js';
import { GetConsent } from './application/get-consent.js';
import { UpdateConsent } from './application/update-consent.js';
import { AddTag } from './application/add-tag.js';
import { AddNote } from './application/add-note.js';
import { GetTimeline } from './application/get-timeline.js';
import { MergeCustomers } from './application/merge-customers.js';

/** Phase 1 + 2: a salon's client records. Exports CustomersRepo so payments can
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
    CustomerPreferencesRepo,
    CustomerTagsRepo,
    CustomerNotesRepo,
    CommunicationConsentsRepo,
    CustomerTimelineRepo,
    CustomerMergeRepo,
    GetPreferences,
    UpdatePreferences,
    GetConsent,
    UpdateConsent,
    AddTag,
    AddNote,
    GetTimeline,
    MergeCustomers,
  ],
  exports: [CustomersRepo, CustomerPreferencesRepo, CommunicationConsentsRepo],
})
export class CustomersModule {}

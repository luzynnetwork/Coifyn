import { NotFoundException } from '@nestjs/common';
import type { CustomerRow, CustomersRepo } from '../data/customers.repo.js';

/** Loads a customer in this salon or throws 404 (RLS already hides other salons). */
export async function requireCustomer(
  customers: CustomersRepo,
  salonId: string,
  id: string,
): Promise<CustomerRow> {
  const customer = await customers.findById(salonId, id);
  if (!customer) throw new NotFoundException('Customer not found.');
  return customer;
}

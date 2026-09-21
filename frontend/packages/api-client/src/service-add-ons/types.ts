/** Service add-on wire types, mirrored from the `service_add_on` drizzle table and its DTOs. */

export interface ServiceAddOnView {
  id: string;
  salonId: string;
  name: string;
  /** Integer minor currency units. */
  priceMinor: number;
  durationMin: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateServiceAddOnInput {
  /** 1-80 chars. */
  name: string;
  priceMinor: number;
  durationMin: number;
}

export interface UpdateServiceAddOnInput {
  name?: string;
  priceMinor?: number;
  durationMin?: number;
  isActive?: boolean;
}

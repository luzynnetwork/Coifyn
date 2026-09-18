/** Service add-on wire types — documented contract. */

export interface ServiceAddOnView {
  id: string;
  salonId: string;
  name: string;
  priceMinor: number;
  durationMin: number;
  createdAt: string;
}

export interface CreateServiceAddOnInput {
  name: string;
  priceMinor: number;
  durationMin: number;
}

export interface UpdateServiceAddOnInput {
  name?: string;
  priceMinor?: number;
  durationMin?: number;
}

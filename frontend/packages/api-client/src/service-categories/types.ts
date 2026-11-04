/** Service category wire types, mirrored from the `service_category` drizzle table and its DTOs. */

export interface ServiceCategoryView {
  id: string;
  salonId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateServiceCategoryInput {
  /** 1-80 chars, unique per salon. */
  name: string;
  order?: number;
}

export interface UpdateServiceCategoryInput {
  name?: string;
  order?: number;
}

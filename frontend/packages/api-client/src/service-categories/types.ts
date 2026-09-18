/** Service category wire types — documented contract. */

export interface ServiceCategoryView {
  id: string;
  salonId: string;
  name: string;
  order: number;
  createdAt: string;
}

export interface CreateServiceCategoryInput {
  name: string;
  order?: number;
}

export interface UpdateServiceCategoryInput {
  name?: string;
  order?: number;
}

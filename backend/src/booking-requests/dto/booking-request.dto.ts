import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class ListBookingRequestsQuery {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsIn(['requested', 'confirmed', 'declined'])
  status?: 'requested' | 'confirmed' | 'declined';
}

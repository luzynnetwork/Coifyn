import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

export class DashboardQuery {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsIn(['today', 'week', 'month'])
  range: 'today' | 'week' | 'month' = 'today';

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  compare = true;
}

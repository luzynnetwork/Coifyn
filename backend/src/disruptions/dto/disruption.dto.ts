import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class DeclareDisruptionDto {
  @IsUUID()
  stylistId!: string;

  @IsIn(['running_late', 'absent', 'left_early'])
  kind!: 'running_late' | 'absent' | 'left_early';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  minutesLate?: number;

  @IsOptional()
  @IsDateString()
  windowStart?: string;

  @IsOptional()
  @IsDateString()
  windowEnd?: string;
}

export class RunningLateDto {
  @IsInt()
  @Min(1)
  @Max(480)
  minutes!: number;
}

export class ListDisruptionsQuery {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsIn(['open', 'resolved'])
  status?: 'open' | 'resolved';
}

export class ResolveOfferDto {
  @IsIn(['wait', 'next_slot', 'stand_in', 'cancel'])
  choice!: 'wait' | 'next_slot' | 'stand_in' | 'cancel';

  @IsOptional()
  @IsUUID()
  standInStylistId?: string;
}

import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTicketDto {
  @IsUUID()
  branchId!: string;

  @IsIn(['queue', 'appointment', 'walk_in'])
  source!: 'queue' | 'appointment' | 'walk_in';

  /** The queue entry or appointment this sale is for. Required unless walk_in. */
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class AddTicketLineDto {
  @IsIn(['service', 'add_on'])
  kind!: 'service' | 'add_on';

  @IsUUID()
  refId!: string;

  /** The stylist doing the work; their per-service price override applies. */
  @IsOptional()
  @IsUUID()
  stylistId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  qty?: number;
}

export class UpdateTicketLineDto {
  @IsInt()
  @Min(1)
  @Max(99)
  qty!: number;
}

export class ApplyDiscountDto {
  @IsIn(['percent', 'amount'])
  type!: 'percent' | 'amount';

  /** percent: basis points (1000 = 10%). amount: minor units. */
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  value!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

export class VoidTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

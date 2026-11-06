import {
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class TakePaymentDto {
  @IsUUID()
  ticketId!: string;

  @IsIn(['cash', 'card'])
  method!: 'cash' | 'card';

  /** Amount applied to the ticket, minor units. May not exceed the balance due. */
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  amountMinor!: number;
}

export class RefundPaymentDto {
  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  amountMinor!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

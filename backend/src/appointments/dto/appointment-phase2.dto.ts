import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class HoldSlotDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  stylistId!: string;

  @IsOptional()
  @IsUUID()
  chairId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  serviceIds!: string[];

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}

export class ConfirmHoldDto {
  @IsUUID()
  holdId!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class RescheduleDto {
  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  overrideReason?: string;
}

export class ReassignStylistDto {
  @IsUUID()
  stylistId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  overrideReason?: string;
}

export class DaySheetQuery {
  @IsUUID()
  stylistId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;
}

import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class RosterQuery {
  @IsUUID()
  branchId!: string;

  @Matches(DATE, { message: 'from must be YYYY-MM-DD' })
  from!: string;

  @Matches(DATE, { message: 'to must be YYYY-MM-DD' })
  to!: string;
}

export class CreateShiftDto {
  @IsUUID()
  stylistId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsUUID()
  chairId?: string;

  @IsOptional()
  @IsIn(['regular', 'override'])
  kind?: 'regular' | 'override';
}

export class UpdateShiftDto {
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsUUID()
  chairId?: string;
}

export class PatternEntryDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @Matches(TIME, { message: 'start must be HH:MM' })
  start!: string;

  @Matches(TIME, { message: 'end must be HH:MM' })
  end!: string;
}

export class CreateShiftTemplateDto {
  @IsUUID()
  stylistId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsUUID()
  chairId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(21)
  @ValidateNested({ each: true })
  @Type(() => PatternEntryDto)
  pattern!: PatternEntryDto[];
}

export class ApplyShiftTemplateDto {
  @Matches(DATE, { message: 'from must be YYYY-MM-DD' })
  from!: string;

  @Matches(DATE, { message: 'to must be YYYY-MM-DD' })
  to!: string;
}

export class RequestTimeOffDto {
  @IsUUID()
  stylistId!: string;

  @IsDateString()
  fromAt!: string;

  @IsDateString()
  toAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class ListTimeOffQuery {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsIn(['requested', 'approved', 'denied'])
  status?: 'requested' | 'approved' | 'denied';
}

export class SlotsQuery {
  @IsUUID()
  stylistId!: string;

  /** Comma-separated service ids. */
  @IsString()
  serviceIds!: string;

  @Matches(DATE, { message: 'date must be YYYY-MM-DD' })
  date!: string;
}

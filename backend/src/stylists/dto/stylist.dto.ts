import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const STYLIST_STATUSES = [
  'available',
  'working',
  'busy',
  'on_break',
  'off_shift',
  'on_leave',
] as const;
export type StylistStatus = (typeof STYLIST_STATUSES)[number];

export class CreateStylistDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  branchId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

export class UpdateStylistDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

export class SetStylistStatusDto {
  @IsIn(STYLIST_STATUSES)
  status!: StylistStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class StylistServiceEntryDto {
  @IsUUID()
  serviceId!: string;

  @IsOptional()
  @IsInt()
  priceOverrideMinor?: number | null;

  @IsOptional()
  @IsInt()
  durationOverrideMin?: number | null;

  @IsOptional()
  @IsBoolean()
  canPerform?: boolean;
}

export class SetStylistServicesDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => StylistServiceEntryDto)
  entries!: StylistServiceEntryDto[];
}

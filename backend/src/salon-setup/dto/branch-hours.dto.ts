import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class BreakWindowDto {
  @IsString()
  @Matches(HHMM, { message: 'start must be "HH:MM" 24h' })
  start!: string;

  @IsString()
  @Matches(HHMM, { message: 'end must be "HH:MM" 24h' })
  end!: string;
}

export class WeekdayHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsBoolean()
  isClosed!: boolean;

  @IsOptional()
  @IsString()
  @Matches(HHMM, { message: 'opensAt must be "HH:MM" 24h' })
  opensAt?: string;

  @IsOptional()
  @IsString()
  @Matches(HHMM, { message: 'closesAt must be "HH:MM" 24h' })
  closesAt?: string;

  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => BreakWindowDto)
  breaks!: BreakWindowDto[];
}

export class SetBranchHoursDto {
  /** Always the full week — one entry per weekday, 0 (Sun) .. 6 (Sat). */
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WeekdayHoursDto)
  week!: WeekdayHoursDto[];
}

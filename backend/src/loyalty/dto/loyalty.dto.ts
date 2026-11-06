import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AdjustPointsDto {
  /** Signed; positive adds, negative removes. */
  @IsInt()
  @Min(-100000)
  @Max(100000)
  delta!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

export class TierDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsInt()
  @Min(1)
  minPoints!: number;
}

export class PutRulesDto {
  @IsInt()
  @Min(0)
  @Max(1000)
  pointsPerUnit!: number;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => TierDto)
  tiers!: TierDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expiryDays?: number;
}

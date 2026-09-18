import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTaxRateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  /** Basis points: 800 = 8.00%. */
  @IsInt()
  @Min(0)
  @Max(10000)
  percentBasisPoints!: number;

  @IsBoolean()
  inclusive!: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateTaxRateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  percentBasisPoints?: number;

  @IsOptional()
  @IsBoolean()
  inclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

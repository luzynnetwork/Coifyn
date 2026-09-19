import { IsBoolean, IsInt, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class CreateServiceAddOnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  /** Integer minor currency units — never a float (architecture.md §8). */
  @IsInt()
  @Min(0)
  priceMinor!: number;

  @IsInt()
  @Min(0)
  durationMin!: number;
}

export class UpdateServiceAddOnDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceMinor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

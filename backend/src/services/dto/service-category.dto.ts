import { IsInt, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class CreateServiceCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateServiceCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

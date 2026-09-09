import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSalonDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brandName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;

  @IsOptional()
  @IsObject()
  taxProfile?: Record<string, unknown>;
}

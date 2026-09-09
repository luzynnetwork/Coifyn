import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsObject()
  address?: Record<string, unknown>;
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsObject()
  address?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetBranchHoursDto {
  /** Free-form for now: { mon: { open: "09:00", close: "18:00", breaks: [...] }, ... }.
   *  A typed shape lands with the availability module (Phase 2). */
  @IsObject()
  hours!: Record<string, unknown>;
}

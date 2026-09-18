import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChairDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;
}

export class UpdateChairDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  branchIds?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

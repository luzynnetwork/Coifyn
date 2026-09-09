import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class GrantDto {
  @IsString()
  permissionKey!: string;

  @IsIn(['org', 'branch'])
  scope!: 'org' | 'branch';
}

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrantDto)
  grants!: GrantDto[];
}

export class UpdateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrantDto)
  grants?: GrantDto[];
}

export class AssignRoleDto {
  @IsUUID()
  roleId!: string;
}

export class SetBranchMembershipsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  branchIds!: string[];
}

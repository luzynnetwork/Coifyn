import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsUUID,
} from 'class-validator';

export class CreateStaffInviteDto {
  @IsEmail()
  email!: string;

  @IsUUID()
  roleId!: string;

  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  branchIds!: string[];
}

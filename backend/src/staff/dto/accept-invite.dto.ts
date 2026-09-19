import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * `password`/`displayName` are only required when the invited email has no
 * existing account — AcceptStaffInvite creates one using them, reusing the
 * same PasswordService as auth's Register flow. When the email already has an
 * account, `password` is instead checked against it (this endpoint doubles as
 * the sign-in step for an existing user accepting a new salon's invite).
 */
export class AcceptStaffInviteDto {
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;
}

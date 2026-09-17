import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** All customer-portal auth request bodies. One file — they are tiny and always
 *  change together (mirrors auth/dto/auth.dto.ts). */

export class RegisterCustomerDto {
  @ValidateIf((o: RegisterCustomerDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((o: RegisterCustomerDto) => !o.email)
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  phone?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;
}

export class VerifyCustomerDto {
  @IsString()
  @MinLength(1)
  identifier!: string; // email or phone used at registration

  @IsString()
  @MinLength(1)
  code!: string;
}

export class LoginCustomerDto {
  @IsString()
  @MinLength(1)
  identifier!: string; // email or phone

  @IsString()
  @MinLength(1)
  password!: string;
}

export class LogoutCustomerDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class ForgotCustomerPasswordDto {
  @IsString()
  @MinLength(1)
  identifier!: string;
}

export class ResetCustomerPasswordDto {
  @IsString()
  @MinLength(1)
  identifier!: string;

  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  newPassword!: string;
}

export class UpdateMeCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;
}

/** Not currently used by a route (kept for symmetry with auth's RefreshDto —
 *  the portal issues a fresh pair on every login rather than exposing a
 *  standalone refresh endpoint in Phase 0). Left out of the controller. */
export class RefreshCustomerDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** All auth request bodies. One file — they are tiny and always change together. */

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class LogoutDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  newPassword!: string;
}

export class UpdateMeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;
}

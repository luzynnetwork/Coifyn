import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Body for POST /onboarding/salon — turns the authenticated user into the
 *  Owner of a brand-new salon with its first branch. */
export class CreateSalonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  salonName!: string;

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

  /** Name of the first branch. Defaults to the salon name. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstBranchName?: string;
}

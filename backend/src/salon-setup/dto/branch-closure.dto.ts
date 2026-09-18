import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBranchClosureDto {
  @IsDateString()
  startsOn!: string;

  @IsDateString()
  endsOn!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  reason!: string;
}

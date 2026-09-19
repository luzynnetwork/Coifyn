import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class OpenRegisterSessionDto {
  @IsUUID()
  branchId!: string;

  @IsInt()
  @Min(0)
  @Max(100_000_000)
  openingFloatMinor!: number;
}

export class CloseRegisterSessionDto {
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  closingCountMinor!: number;
}

export class CurrentRegisterSessionQuery {
  @IsUUID()
  branchId!: string;
}

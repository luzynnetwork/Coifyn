import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class JoinQueueDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  walkInName?: string;

  @IsOptional()
  @IsUUID()
  requestedStylistId?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  requestedServiceIds!: string[];
}

export class AssignQueueEntryDto {
  @IsUUID()
  stylistId!: string;

  @IsUUID()
  chairId!: string;
}

export class RemoveQueueEntryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  reason!: string;
}

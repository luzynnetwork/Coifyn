import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  stylistId!: string;

  @IsOptional()
  @IsUUID()
  chairId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  serviceIds!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  addOnIds?: string[];

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  /** Books over a conflict. Requires appointment:override; audited with this text. */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  overrideReason?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  stylistId?: string;

  @IsOptional()
  @IsUUID()
  chairId?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  overrideReason?: string;
}

export class ListAppointmentsQuery {
  @IsUUID()
  branchId!: string;

  /** Local calendar day in the salon's timezone, YYYY-MM-DD. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;
}

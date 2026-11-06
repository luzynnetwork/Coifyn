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

export class PublicSlotsQuery {
  @IsUUID()
  stylistId!: string;

  /** Comma-separated service ids. */
  @IsString()
  serviceIds!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;
}

export class SubmitBookingRequestDto {
  @IsUUID()
  stylistId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUUID('all', { each: true })
  serviceIds!: string[];

  @IsDateString()
  startAt!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  customerName!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(30)
  customerPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

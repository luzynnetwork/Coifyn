import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CutRecordFieldsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  serviceIds?: string[];

  /** e.g. { sides: 1, back: 1.5, top: "scissor" } */
  @IsOptional()
  @IsObject()
  clipperGuards?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  fadeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  partingNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  beardNotes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  productsUsed?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  freeText?: string;
}

export class CreateCutRecordDto extends CutRecordFieldsDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;

  /** Defaults to the caller's own stylist profile, else the appointment's stylist. */
  @IsOptional()
  @IsUUID()
  stylistId?: string;
}

export class UpdateCutRecordDto extends CutRecordFieldsDto {}

export class AddPhotoDto {
  @IsIn(['front', 'left', 'right', 'back'])
  angle!: 'front' | 'left' | 'right' | 'back';

  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: string;
}

export class CreateFormulaDto {
  @IsUUID()
  customerId!: string;

  @IsIn(['color', 'perm', 'treatment'])
  kind!: 'color' | 'perm' | 'treatment';

  @IsString()
  @MaxLength(1000)
  formula!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  developer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  processingMin?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateFormulaDto {
  @IsOptional()
  @IsIn(['color', 'perm', 'treatment'])
  kind?: 'color' | 'perm' | 'treatment';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  formula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  developer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  processingMin?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

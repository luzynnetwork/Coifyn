import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const CHANNELS = ['sms', 'email', 'whatsapp'] as const;
export const PURPOSES = ['transactional', 'marketing'] as const;

export class UpdatePreferencesDto {
  @IsOptional()
  @IsUUID()
  preferredStylistId?: string;

  @IsOptional()
  @IsUUID()
  preferredChairId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  drink?: string;

  @IsOptional()
  @IsIn(['chatty', 'some', 'quiet'])
  conversationLevel?: string;

  @IsOptional()
  @IsIn(CHANNELS)
  communicationChannel?: string;
}

export class UpdateConsentDto {
  @IsIn(CHANNELS)
  channel!: string;

  @IsIn(PURPOSES)
  purpose!: string;

  @IsIn(['granted', 'revoked'])
  status!: 'granted' | 'revoked';
}

export class AddTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  tag!: string;
}

export class AddNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class MergeCustomersDto {
  @IsUUID()
  survivorId!: string;

  @IsUUID()
  mergedId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

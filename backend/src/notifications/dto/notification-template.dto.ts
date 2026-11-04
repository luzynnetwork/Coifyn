import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { NOTIFICATION_CATALOG } from '../catalog/notification-catalog.js';

export class CreateTemplateDto {
  @IsIn(Object.keys(NOTIFICATION_CATALOG))
  key!: string;

  @IsIn(['sms', 'email'])
  channel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;
}

export class ListDeliveriesQuery {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

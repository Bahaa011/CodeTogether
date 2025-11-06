import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  @Min(1)
  recipientId: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateNotificationStatusDto {
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}

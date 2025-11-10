import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsObject,
} from 'class-validator';

/**
 * DTO for creating a new notification.
 */
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

/**
 * DTO for updating the read status of a notification.
 */
export class UpdateNotificationStatusDto {
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}

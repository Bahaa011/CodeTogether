import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO for creating a new file version.
 */
export class CreateVersionDto {
  @IsInt()
  @Min(1)
  file_id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  session_id?: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  label?: string;
}

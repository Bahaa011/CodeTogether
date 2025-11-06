import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
}

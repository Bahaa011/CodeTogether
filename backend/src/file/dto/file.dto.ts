import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  file_type: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  @Min(1)
  projectId: number;

  @IsInt()
  @Min(1)
  uploaderId: number;
}

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  file_type?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

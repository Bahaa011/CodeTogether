import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @Min(1)
  authorId: number;

  @IsInt()
  @Min(1)
  projectId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  fileId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  versionId?: number;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}

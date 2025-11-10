import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO for creating a new project tag.
 */
export class CreateProjectTagDto {
  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsInt()
  @Min(1)
  projectId: number;
}

/**
 * DTO for updating an existing project tag.
 */
export class UpdateProjectTagDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tag?: string;
}

import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateProjectTagDto {
  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsInt()
  @Min(1)
  projectId: number;
}

export class UpdateProjectTagDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tag?: string;
}

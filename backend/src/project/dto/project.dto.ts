import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MAX_PROJECT_TAGS, PROJECT_TAG_OPTIONS } from '../project.constants';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(1)
  owner_id: number;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PROJECT_TAGS)
  @ArrayUnique()
  @IsIn(PROJECT_TAG_OPTIONS, { each: true })
  tags?: string[];
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PROJECT_TAGS)
  @ArrayUnique()
  @IsIn(PROJECT_TAG_OPTIONS, { each: true })
  tags?: string[];
}

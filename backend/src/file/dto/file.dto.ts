import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

@ObjectType()
export class FileUserInfo {
  @Field(() => ID)
  id: number;

  @Field(() => String, { nullable: true })
  username?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  avatar_url?: string | null;
}

@ObjectType()
export class ProjectFileModel {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  filename: string;

  @Field(() => String)
  file_type: string;

  @Field(() => String, { nullable: true })
  content?: string | null;

  @Field(() => GraphQLISODateTime)
  created_at: Date;

  @Field(() => GraphQLISODateTime)
  updated_at: Date;

  @Field(() => Int, { nullable: true })
  project_id?: number | null;

  @Field(() => Int, { nullable: true })
  uploader_id?: number | null;

  @Field(() => FileUserInfo, { nullable: true })
  uploader?: FileUserInfo | null;
}

@InputType()
export class CreateFileInput {
  @Field(() => String)
  @IsString()
  @MaxLength(255)
  filename: string;

  @Field(() => String)
  @IsString()
  @MaxLength(255)
  file_type: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  projectId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  uploaderId: number;
}

@InputType()
export class UpdateFileInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  file_type?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  content?: string;
}

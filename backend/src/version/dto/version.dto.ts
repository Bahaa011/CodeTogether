import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

@ObjectType()
export class VersionUserInfo {
  @Field(() => ID)
  id: number;

  @Field(() => String, { nullable: true })
  username?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;
}

@ObjectType()
export class VersionSessionInfo {
  @Field(() => ID)
  id: number;
}

@ObjectType()
export class VersionFileInfo {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  filename: string;

  @Field(() => String)
  file_type: string;
}

@ObjectType()
export class VersionModel {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  version_number: number;

  @Field(() => String)
  content: string;

  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field(() => GraphQLISODateTime)
  created_at: Date;

  @Field(() => VersionFileInfo, { nullable: true })
  file?: VersionFileInfo | null;

  @Field(() => VersionUserInfo, { nullable: true })
  user?: VersionUserInfo | null;

  @Field(() => VersionSessionInfo, { nullable: true })
  session?: VersionSessionInfo | null;
}

@ObjectType()
export class VersionFileModel extends VersionFileInfo {
  @Field(() => String)
  content: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updated_at?: Date | null;
}

@InputType()
export class CreateVersionInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  fileId: number;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  content: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionId?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  label?: string | null;
}

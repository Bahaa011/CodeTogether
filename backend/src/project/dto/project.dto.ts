import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { User } from '../../user/user.entity';

@ObjectType()
export class ProjectTagModel {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  tag: string;

  @Field(() => Int, { nullable: true })
  project_id?: number | null;
}

@ObjectType()
export class ProjectCollaboratorUser {
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
export class ProjectCollaboratorInfo {
  @Field(() => ID)
  id: number;

  @Field(() => String, { nullable: true })
  role?: string | null;

  @Field(() => ProjectCollaboratorUser, { nullable: true })
  user?: ProjectCollaboratorUser | null;
}

@ObjectType()
export class ProjectModel {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => GraphQLISODateTime)
  created_at: Date;

  @Field(() => GraphQLISODateTime)
  updated_at: Date;

  @Field(() => Boolean)
  is_public: boolean;

  @Field(() => Int, { nullable: true })
  owner_id?: number | null;

  @Field(() => User, { nullable: true })
  owner?: User | null;

  @Field(() => [ProjectTagModel], { nullable: true })
  tags?: ProjectTagModel[] | null;

  @Field(() => [ProjectCollaboratorInfo], { nullable: true })
  collaborators?: ProjectCollaboratorInfo[] | null;
}

@InputType()
export class CreateProjectInput {
  @Field(() => String)
  @IsString()
  @MaxLength(255)
  title: string;

  @Field(() => String)
  @IsString()
  description: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  owner_id: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

@InputType()
export class UpdateProjectInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

import {
  Field,
  GraphQLISODateTime,
  Int,
  ID,
  InputType,
  ObjectType,
} from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

@ObjectType()
export class CollaboratorUserInfo {
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
export class CollaboratorProjectTag {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  tag: string;
}

@ObjectType()
export class CollaboratorProjectInfo {
  @Field(() => ID)
  id: number;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Boolean, { nullable: true })
  is_public?: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updated_at?: Date | null;

  @Field(() => Int, { nullable: true })
  owner_id?: number | null;

  @Field(() => CollaboratorUserInfo, { nullable: true })
  owner?: CollaboratorUserInfo | null;

  @Field(() => [CollaboratorProjectTag], { nullable: true })
  tags?: CollaboratorProjectTag[] | null;
}

@ObjectType('Collaborator')
export class CollaboratorModel {
  @Field(() => ID)
  id: number;

  @Field()
  role: string;

  @Field(() => GraphQLISODateTime)
  added_at: Date;

  @Field(() => CollaboratorUserInfo, { nullable: true })
  user?: CollaboratorUserInfo | null;

  @Field(() => CollaboratorProjectInfo, { nullable: true })
  project?: CollaboratorProjectInfo | null;
}

@ObjectType()
export class CollaboratorActionResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  accepted?: boolean;
}

@InputType()
export class CreateCollaboratorInput {
  @Field()
  @IsInt()
  @Min(1)
  userId: number;

  @Field()
  @IsInt()
  @Min(1)
  projectId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  role?: string;
}

@InputType()
export class UpdateCollaboratorRoleInput {
  @Field()
  @IsString()
  role: string;
}

@InputType()
export class InviteCollaboratorInput {
  @Field()
  @IsInt()
  @Min(1)
  inviterId: number;

  @Field()
  @IsInt()
  @Min(1)
  projectId: number;

  @Field()
  @IsString()
  inviteeIdentifier: string;
}

@InputType()
export class RespondCollaboratorInviteInput {
  @Field()
  @IsBoolean()
  accept: boolean;

  @Field()
  @IsInt()
  @Min(1)
  userId: number;
}

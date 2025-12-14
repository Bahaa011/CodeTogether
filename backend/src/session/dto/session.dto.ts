import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';

@ObjectType()
export class SessionUserInfo {
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
export class SessionProjectInfo {
  @Field(() => ID)
  id: number;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;
}

@ObjectType()
export class ProjectSessionModel {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  status: string;

  @Field(() => GraphQLISODateTime)
  started_at: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  ended_at?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  last_activity?: Date | null;

  @Field(() => String, { nullable: true })
  session_token?: string | null;

  @Field(() => SessionUserInfo, { nullable: true })
  user?: SessionUserInfo | null;

  @Field(() => SessionProjectInfo, { nullable: true })
  project?: SessionProjectInfo | null;
}

@InputType()
export class CreateSessionInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  userId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  projectId: number;
}

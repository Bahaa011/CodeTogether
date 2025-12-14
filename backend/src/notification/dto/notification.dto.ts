import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsObject,
} from 'class-validator';

@ObjectType()
export class NotificationRecipientInfo {
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
export class NotificationModel {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  message: string;

  @Field(() => String)
  type: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, unknown> | null;

  @Field(() => Boolean)
  is_read: boolean;

  @Field(() => GraphQLISODateTime)
  created_at: Date;

  @Field(() => GraphQLISODateTime)
  updated_at: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  read_at?: Date | null;

  @Field(() => NotificationRecipientInfo, { nullable: true })
  recipient?: NotificationRecipientInfo | null;
}

@InputType()
export class CreateNotificationInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  recipientId: number;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  message: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  type?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

@InputType()
export class UpdateNotificationStatusInput {
  @Field(() => Boolean)
  @IsBoolean()
  is_read: boolean;
}

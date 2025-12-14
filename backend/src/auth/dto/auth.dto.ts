import { Field, InputType, ObjectType, createUnionType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { User } from '../../user/user.entity';

@InputType()
export class LoginInput {
  @IsEmail()
  @Field()
  email: string;

  @IsString()
  @Field()
  password: string;
}

@InputType()
export class VerifyMfaInput {
  @IsString()
  @Field()
  token: string;

  @IsString()
  @Length(6, 6)
  @Field()
  code: string;
}

@InputType()
export class ToggleMfaInput {
  @IsBoolean()
  @Field()
  enabled: boolean;
}

@InputType()
export class RequestPasswordResetInput {
  @IsEmail()
  @Field()
  email: string;
}

@InputType()
export class ResetPasswordInput {
  @IsString()
  @Field()
  token: string;

  @IsString()
  @MinLength(6)
  @Field()
  newPassword: string;
}

@ObjectType()
export class AuthSession {
  @Field()
  access_token: string;

  @Field(() => User)
  user: User;
}

@ObjectType()
export class MfaChallenge {
  @Field()
  requires_mfa: boolean;

  @Field()
  mfaToken: string;

  @Field({ nullable: true })
  message?: string;
}

@ObjectType()
export class ActionMessage {
  @Field()
  message: string;

  @Field({ nullable: true })
  resetLink?: string;
}

export const LoginResponse = createUnionType({
  name: 'LoginResponse',
  types: () => [AuthSession, MfaChallenge] as const,
  resolveType(value) {
    if (value && 'access_token' in value) {
      return AuthSession;
    }
    if (value && 'requires_mfa' in value) {
      return MfaChallenge;
    }
    return null;
  },
});

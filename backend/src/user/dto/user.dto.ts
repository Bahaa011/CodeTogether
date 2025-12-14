import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

/**
 * DTO for user registration requests.
 */
@InputType()
export class RegisterUserDto {
  @Field()
  @IsString()
  username: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}

/**
 * DTO for updating user profile details.
 * All fields are optional.
 */
@InputType()
export class UpdateUserProfileDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  avatar_url?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  bio?: string;
}

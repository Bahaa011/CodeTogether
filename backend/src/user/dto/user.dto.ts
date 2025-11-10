import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for user registration requests.
 */
export class RegisterUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

/**
 * DTO for updating user profile details.
 * All fields are optional.
 */
export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

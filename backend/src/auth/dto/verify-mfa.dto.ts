/**
 * VerifyMfaDto
 * --------------
 * Defines the data structure for verifying a multi-factor authentication (MFA) attempt.
 * Includes both the MFA token and the verification code.
 */

import { IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  token: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

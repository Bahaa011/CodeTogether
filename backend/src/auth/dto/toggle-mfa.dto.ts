/**
 * ToggleMfaDto
 * --------------
 * Defines the data structure for enabling or disabling multi-factor authentication.
 */

import { IsBoolean } from 'class-validator';

export class ToggleMfaDto {
  @IsBoolean()
  enabled: boolean;
}

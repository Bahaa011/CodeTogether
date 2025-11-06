import { IsBoolean } from 'class-validator';

export class ToggleMfaDto {
  @IsBoolean()
  enabled: boolean;
}

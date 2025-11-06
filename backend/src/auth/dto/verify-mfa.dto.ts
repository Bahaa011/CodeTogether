import { IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  token: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

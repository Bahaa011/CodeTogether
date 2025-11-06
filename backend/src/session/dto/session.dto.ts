import { IsInt, Min } from 'class-validator';

export class CreateSessionDto {
  @IsInt()
  @Min(1)
  user_id: number;

  @IsInt()
  @Min(1)
  project_id: number;

  @IsInt()
  @Min(1)
  file_id: number;
}

export class EndSessionDto {
  @IsInt()
  @Min(1)
  session_id: number;
}

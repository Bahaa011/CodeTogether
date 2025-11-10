import { IsInt, Min } from 'class-validator';

/**
 * DTO for starting a new user session.
 */
export class CreateSessionDto {
  @IsInt()
  @Min(1)
  user_id: number;

  @IsInt()
  @Min(1)
  project_id: number;
}

/**
 * DTO for ending an existing session.
 */
export class EndSessionDto {
  @IsInt()
  @Min(1)
  session_id: number;
}

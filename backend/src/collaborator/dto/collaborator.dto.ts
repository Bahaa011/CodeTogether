import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCollaboratorDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsInt()
  @Min(1)
  projectId: number;

  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateCollaboratorRoleDto {
  @IsString()
  role: string;
}

export class InviteCollaboratorDto {
  @IsInt()
  @Min(1)
  inviterId: number;

  @IsInt()
  @Min(1)
  projectId: number;

  @IsString()
  inviteeIdentifier: string;
}

export class RespondCollaboratorInviteDto {
  @IsBoolean()
  accept: boolean;

  @IsInt()
  @Min(1)
  userId: number;
}

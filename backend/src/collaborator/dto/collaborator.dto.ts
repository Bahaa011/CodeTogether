/**
 * Collaborator DTOs
 * ------------------
 * Defines the data transfer objects used for creating, updating, and managing collaborators.
 * Includes operations for invitations, role updates, and invite responses.
 */

import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * DTO for adding a collaborator to a project.
 */
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

/**
 * DTO for updating a collaborator's role.
 */
export class UpdateCollaboratorRoleDto {
  @IsString()
  role: string;
}

/**
 * DTO for inviting a collaborator by email or username.
 */
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

/**
 * DTO for accepting or rejecting a collaboration invite.
 */
export class RespondCollaboratorInviteDto {
  @IsBoolean()
  accept: boolean;

  @IsInt()
  @Min(1)
  userId: number;
}

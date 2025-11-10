/**
 * CollaboratorController
 * -----------------------
 * Handles all API endpoints related to project collaborators.
 * Supports collaborator management, invitations, role updates, and invite responses.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CollaboratorService } from './collaborator.service';
import {
  CreateCollaboratorDto,
  UpdateCollaboratorRoleDto,
  InviteCollaboratorDto,
  RespondCollaboratorInviteDto,
} from './dto/collaborator.dto';

@Controller('collaborators')
export class CollaboratorController {
  constructor(private readonly service: CollaboratorService) {}

  /**
   * Retrieve all collaborators in the system.
   */
  @Get()
  async findAll() {
    const collabs = await this.service.getAllCollaborators();
    if (!collabs || collabs.length === 0)
      throw new NotFoundException('No collaborators found.');
    return collabs;
  }

  /**
   * Retrieve all collaborators associated with a specific project.
   */
  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: number) {
    const collabs = await this.service.getCollaboratorsByProject(projectId);
    return collabs ?? [];
  }

  /**
   * Count the number of projects a specific user collaborates on.
   */
  @Get('user/:userId/count')
  async countByUser(@Param('userId') userId: number) {
    const count = await this.service.countCollaborationsByUser(userId);
    return { user_id: Number(userId), count };
  }

  /**
   * Retrieve all projects where a specific user is a collaborator.
   */
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: number) {
    const collabs = await this.service.getCollaboratorsByUser(userId);
    if (!collabs || collabs.length === 0)
      throw new NotFoundException('No collaborations found for this user.');
    return collabs;
  }

  /**
   * Add a new collaborator to a project.
   */
  @Post()
  async add(@Body() createDto: CreateCollaboratorDto) {
    const { userId, projectId, role } = createDto;

    if (!userId || !projectId)
      throw new BadRequestException('Missing required fields.');

    return await this.service.addCollaborator(userId, projectId, role);
  }

  /**
   * Update the role of an existing collaborator.
   */
  @Put(':id')
  async updateRole(
    @Param('id') id: number,
    @Body() updateDto: UpdateCollaboratorRoleDto,
  ) {
    const { role } = updateDto;

    if (!role)
      throw new BadRequestException('New role must be provided.');

    const updated = await this.service.updateCollaboratorRole(id, role);
    if (!updated) throw new NotFoundException('Collaborator not found.');

    return { message: 'Collaborator role updated.', collaborator: updated };
  }

  /**
   * Remove a collaborator from a project.
   */
  @Delete(':id')
  async remove(@Param('id') id: number) {
    const success = await this.service.removeCollaborator(id);
    if (!success) throw new NotFoundException('Collaborator not found.');

    return { message: 'Collaborator removed successfully.' };
  }

  /**
   * Send a collaboration invite to a user via email or username.
   */
  @Post('invite')
  async invite(@Body() inviteDto: InviteCollaboratorDto) {
    const { inviterId, projectId, inviteeIdentifier } = inviteDto;
    if (!inviterId || !projectId || !inviteeIdentifier) {
      throw new BadRequestException('Missing required invitation fields.');
    }

    return await this.service.inviteCollaborator(
      inviterId,
      projectId,
      inviteeIdentifier,
    );
  }

  /**
   * Respond to a collaboration invite (accept or reject).
   */
  @Post('invite/:notificationId/respond')
  async respond(
    @Param('notificationId') notificationId: number,
    @Body() respondDto: RespondCollaboratorInviteDto,
  ) {
    const { userId, accept } = respondDto;
    if (typeof accept !== 'boolean' || !userId) {
      throw new BadRequestException('Invalid invitation response payload.');
    }

    return await this.service.respondToInvite(notificationId, userId, accept);
  }
}

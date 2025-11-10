/**
 * SessionController
 * -----------------
 * Handles API endpoints for managing user sessions.
 * Supports session creation, retrieval, and termination.
 */

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto, EndSessionDto } from './dto/session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * Create a new session for a user on a specific project.
   */
  @Post()
  async createSession(@Body() createDto: CreateSessionDto) {
    return await this.sessionService.createSession(
      createDto.user_id,
      createDto.project_id,
    );
  }

  /**
   * Get all active sessions for a specific user.
   */
  @Get('active/:userId')
  async getActiveSessions(@Param('userId') userId: number) {
    return await this.sessionService.getActiveSessions(userId);
  }

  /**
   * Get all active sessions associated with a project.
   */
  @Get('project/:projectId/active')
  async getProjectSessions(@Param('projectId') projectId: number) {
    return await this.sessionService.getActiveSessionsByProject(projectId);
  }

  /**
   * Count long-running sessions for a given user.
   */
  @Get('user/:userId/long')
  async getUserLongSessions(@Param('userId') userId: number) {
    const count = await this.sessionService.countLongSessions(userId);
    return { count };
  }

  /**
   * End a session by its ID.
   */
  @Post('end')
  async endSession(@Body() endDto: EndSessionDto) {
    return await this.sessionService.endSession(endDto.session_id);
  }

  /**
   * Retrieve a session by its unique ID.
   */
  @Get(':id')
  async getSessionById(@Param('id') id: number) {
    return await this.sessionService.getSessionById(id);
  }
}

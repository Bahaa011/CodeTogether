import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto, EndSessionDto } from './dto/session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  // Create new session
  @Post()
  async createSession(@Body() createDto: CreateSessionDto) {
    return await this.sessionService.createSession(
      createDto.user_id,
      createDto.project_id,
    );
  }

  // Get active sessions for a user
  @Get('active/:userId')
  async getActiveSessions(@Param('userId') userId: number) {
    return await this.sessionService.getActiveSessions(userId);
  }

  @Get('project/:projectId/active')
  async getProjectSessions(@Param('projectId') projectId: number) {
    return await this.sessionService.getActiveSessionsByProject(projectId);
  }

  @Get('user/:userId/long')
  async getUserLongSessions(@Param('userId') userId: number) {
    const count = await this.sessionService.countLongSessions(userId);
    return { count };
  }

  // End session
  @Post('end')
  async endSession(@Body() endDto: EndSessionDto) {
    return await this.sessionService.endSession(endDto.session_id);
  }

  // Get session by ID
  @Get(':id')
  async getSessionById(@Param('id') id: number) {
    return await this.sessionService.getSessionById(id);
  }
}

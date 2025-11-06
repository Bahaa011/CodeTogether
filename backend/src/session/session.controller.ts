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
      createDto.file_id,
    );
  }

  // Get active sessions for a user
  @Get('active/:userId')
  async getActiveSessions(@Param('userId') userId: number) {
    return await this.sessionService.getActiveSessions(userId);
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

/**
 * SessionModule
 * --------------
 * Provides functionality for managing user sessions.
 * Handles session creation, retrieval, and termination logic.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Session])], // Registers Session entity
  controllers: [SessionController],               // Exposes REST endpoints for session management
  providers: [SessionService],                    // Business logic for sessions
  exports: [SessionService],                      // Makes service reusable by other modules
})
export class SessionModule {}

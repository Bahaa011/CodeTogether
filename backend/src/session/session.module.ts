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
import { SessionResolver } from './session.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Session])], // Registers Session entity
  providers: [SessionService, SessionResolver], // Business logic + GraphQL resolver
  exports: [SessionService], // Makes service reusable by other modules
})
export class SessionModule {}

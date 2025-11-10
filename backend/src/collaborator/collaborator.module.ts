/**
 * CollaboratorModule
 * -------------------
 * Provides functionality for managing project collaborators.
 * Handles collaborator creation, role updates, and collaboration invitations.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaborator } from './collaborator.entity';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorController } from './collaborator.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator, Project, User]), // Registers related entities
    NotificationModule,                                     // Enables sending collaboration notifications
  ],
  controllers: [CollaboratorController],                    // Exposes REST API endpoints
  providers: [CollaboratorService],                         // Contains collaborator business logic
  exports: [CollaboratorService],                           // Makes the service reusable by other modules
})
export class CollaboratorModule {}

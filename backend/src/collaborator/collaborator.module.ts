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
import { NotificationModule } from '../notification/notification.module';
import { CollaboratorResolver } from './collaborator.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator, Project, User]), // Registers related entities
    NotificationModule, // Enables sending collaboration notifications
  ],
  providers: [CollaboratorService, CollaboratorResolver], // Contains collaborator business logic + GraphQL resolver
  exports: [CollaboratorService], // Makes the service reusable by other modules
})
export class CollaboratorModule {}

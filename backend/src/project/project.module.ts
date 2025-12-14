/**
 * ProjectModule
 * --------------
 * Provides functionality for managing projects.
 * Handles creation, updates, deletion, and retrieval of projects,
 * as well as integration with the ProjectTagModule.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectTagModule } from '../project-tag/project-tag.module';
import { ProjectResolver } from './project.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), ProjectTagModule], // Registers Project entity and Tag module dependency
  providers: [ProjectService, ProjectResolver], // Core business logic + GraphQL resolver
  exports: [ProjectService], // Makes the service reusable by other modules
})
export class ProjectModule {}

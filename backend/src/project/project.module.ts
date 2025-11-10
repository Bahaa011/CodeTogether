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
import { ProjectController } from './project.controller';
import { ProjectTagModule } from '../project-tag/project-tag.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), ProjectTagModule], // Registers Project entity and Tag module dependency
  controllers: [ProjectController],                                 // Exposes project-related endpoints
  providers: [ProjectService],                                      // Core business logic for projects
  exports: [ProjectService],                                        // Makes the service reusable by other modules
})
export class ProjectModule {}

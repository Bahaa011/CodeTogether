/**
 * ProjectTagModule
 * ----------------
 * Provides functionality for managing project tags.
 * Handles tag creation, retrieval, updating, and deletion.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTag } from './project-tag.entity';
import { ProjectTagService } from './project-tag.service';
import { ProjectTagResolver } from './project-tag.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTag])], // Registers ProjectTag entity
  providers: [ProjectTagService, ProjectTagResolver], // Contains tag business logic + GraphQL resolver
  exports: [ProjectTagService], // Makes service reusable across modules
})
export class ProjectTagModule {}

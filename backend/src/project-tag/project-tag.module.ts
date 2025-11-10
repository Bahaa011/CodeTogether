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
import { ProjectTagController } from './project-tag.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTag])], // Registers ProjectTag entity
  controllers: [ProjectTagController],               // Exposes tag management endpoints
  providers: [ProjectTagService],                    // Contains tag business logic
  exports: [ProjectTagService],                      // Makes service reusable across modules
})
export class ProjectTagModule {}

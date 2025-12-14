/**
 * FileModule
 * -----------
 * Provides functionality for managing project files.
 * Handles file creation, retrieval, updates, and deletion.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './file.entity';
import { FileService } from './file.service';
import { FileResolver } from './file.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([File])], // Registers File entity with TypeORM
  providers: [FileService, FileResolver], // Business logic + GraphQL resolver
  exports: [FileService], // Makes the service available to other modules
})
export class FileModule {}

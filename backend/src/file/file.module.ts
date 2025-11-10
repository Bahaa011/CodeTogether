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
import { FileController } from './file.controller';

@Module({
  imports: [TypeOrmModule.forFeature([File])], // Registers File entity with TypeORM
  controllers: [FileController],               // Exposes REST endpoints for file operations
  providers: [FileService],                    // Contains business logic for file management
  exports: [FileService],                      // Makes the service available to other modules
})
export class FileModule {}

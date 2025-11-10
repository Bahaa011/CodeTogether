/**
 * VersionModule
 * --------------
 * Provides versioning functionality for project files.
 * Handles storage, retrieval, and management of file versions.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Version } from './version.entity';
import { File } from '../file/file.entity';
import { VersionService } from './version.service';
import { VersionController } from './version.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Version, File])], // Registers Version and File entities
  controllers: [VersionController],                     // Exposes REST endpoints
  providers: [VersionService],                          // Contains business logic
  exports: [VersionService],                            // Makes the service reusable by other modules
})
export class VersionModule {}

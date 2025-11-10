/**
 * VersionController
 * -----------------
 * Manages version history for project files.
 * Provides endpoints to create, list, retrieve, and revert file versions.
 */

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/version.dto';

@Controller('versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  /**
   * Create a new version for a file.
   */
  @Post()
  async createVersion(@Body() createDto: CreateVersionDto) {
    return await this.versionService.createVersion(
      createDto.file_id,
      createDto.user_id,
      createDto.session_id,
      createDto.content,
      createDto.label,
    );
  }

  /**
   * Get all versions associated with a given file.
   */
  @Get('file/:fileId')
  async getFileVersions(@Param('fileId') fileId: number) {
    return await this.versionService.getFileVersions(fileId);
  }

  /**
   * Get the most recent version of a file.
   */
  @Get('latest/:fileId')
  async getLatestVersion(@Param('fileId') fileId: number) {
    return await this.versionService.getLatestVersion(fileId);
  }

  /**
   * Get a version by its unique ID.
   */
  @Get(':id')
  async getVersionById(@Param('id') id: number) {
    return await this.versionService.getVersionById(id);
  }

  /**
   * Revert a file to a previous version by ID.
   */
  @Post(':id/revert')
  async revertVersion(@Param('id') id: number) {
    return await this.versionService.revertVersion(Number(id));
  }
}

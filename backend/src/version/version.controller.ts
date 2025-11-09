import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/version.dto';

@Controller('versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Post()
  async createVersion(
    @Body()
    createDto: CreateVersionDto,
  ) {
    return await this.versionService.createVersion(
      createDto.file_id,
      createDto.user_id,
      createDto.session_id,
      createDto.content,
      createDto.label,
    );
  }

  @Get('file/:fileId')
  async getFileVersions(@Param('fileId') fileId: number) {
    return await this.versionService.getFileVersions(fileId);
  }

  @Get('latest/:fileId')
  async getLatestVersion(@Param('fileId') fileId: number) {
    return await this.versionService.getLatestVersion(fileId);
  }

  @Get(':id')
  async getVersionById(@Param('id') id: number) {
    return await this.versionService.getVersionById(id);
  }

  @Post(':id/revert')
  async revertVersion(@Param('id') id: number) {
    return await this.versionService.revertVersion(Number(id));
  }
}

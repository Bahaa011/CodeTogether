/**
 * FileController
 * ---------------
 * Manages API endpoints for file operations within projects.
 * Handles file creation, retrieval, updating, and deletion.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileService } from './file.service';
import { CreateFileDto, UpdateFileDto } from './dto/file.dto';

@Controller('files')
export class FileController {
  constructor(private readonly service: FileService) {}

  /**
   * Retrieve all files.
   */
  @Get()
  async findAll() {
    const files = await this.service.getAllFiles();
    return files;
  }

  /**
   * Retrieve a file by its unique ID.
   * Throws 404 if the file is not found.
   */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const file = await this.service.getFileById(id);
    if (!file) throw new NotFoundException('File not found.');
    return file;
  }

  /**
   * Retrieve all files belonging to a specific project.
   */
  @Get('project/:projectId')
  async findByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    const files = await this.service.getFilesByProject(projectId);
    return files;
  }

  /**
   * Create a new file within a project.
   */
  @Post()
  async create(@Body() createDto: CreateFileDto) {
    const { filename, file_type, content, projectId, uploaderId } = createDto;
    return await this.service.createFile(
      filename,
      file_type,
      content,
      projectId,
      uploaderId,
    );
  }

  /**
   * Update an existing file.
   * Throws 404 if the file does not exist.
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFileDto,
  ) {
    if (!updateDto || Object.keys(updateDto).length === 0)
      throw new BadRequestException('No data provided for update.');

    const updated = await this.service.updateFile(id, updateDto);
    if (!updated) throw new NotFoundException('File not found.');
    return { file: updated };
  }

  /**
   * Delete a file by its ID.
   * Throws 404 if the file is not found.
   */
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    const success = await this.service.deleteFile(id);
    if (!success) throw new NotFoundException('File not found.');
    return { message: 'File deleted successfully' };
  }
}

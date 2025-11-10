/**
 * ProjectTagController
 * ---------------------
 * Manages CRUD operations for project tags.
 * Allows creating, listing, updating, and deleting tags linked to projects.
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
} from '@nestjs/common';
import { ProjectTagService } from './project-tag.service';
import {
  CreateProjectTagDto,
  UpdateProjectTagDto,
} from './dto/project-tag.dto';

@Controller('project-tags')
export class ProjectTagController {
  constructor(private readonly tagService: ProjectTagService) {}

  /**
   * Get all project tags.
   */
  @Get()
  async findAll() {
    return await this.tagService.findAll();
  }

  /**
   * Get all tags associated with a specific project.
   * Throws a 404 if none are found.
   */
  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: number) {
    const tags = await this.tagService.findByProject(projectId);
    if (!tags || tags.length === 0)
      throw new NotFoundException('No tags found for this project.');
    return tags;
  }

  /**
   * Create a new project tag.
   */
  @Post()
  async create(@Body() createDto: CreateProjectTagDto) {
    const { tag, projectId } = createDto;
    if (!tag || !projectId)
      throw new BadRequestException('Missing required fields.');
    return await this.tagService.create(tag, projectId);
  }

  /**
   * Update an existing project tag by ID.
   */
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateProjectTagDto,
  ) {
    const { tag } = updateDto;
    if (!tag) throw new BadRequestException('Tag must be provided.');
    return await this.tagService.update(id, tag);
  }

  /**
   * Delete a project tag by ID.
   * Throws a 404 if tag not found.
   */
  @Delete(':id')
  async remove(@Param('id') id: number) {
    const removed = await this.tagService.remove(id);
    if (!removed) throw new NotFoundException('Project tag not found.');
    return { message: 'Project tag removed successfully.' };
  }
}

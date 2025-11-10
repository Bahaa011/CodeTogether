/**
 * ProjectController
 * -----------------
 * Manages project-related REST API endpoints.
 * Handles creation, retrieval, updates, and deletion of projects.
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
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  /**
   * Retrieve all projects.
   * Throws 404 if none exist.
   */
  @Get()
  async findAll() {
    const projects = await this.service.getAllProjects();
    if (!projects || projects.length === 0)
      throw new NotFoundException('No projects found.');
    return projects;
  }

  /**
   * Retrieve all public projects.
   */
  @Get('public')
  async findPublic() {
    const projects = await this.service.getPublicProjects();
    if (!projects || projects.length === 0)
      throw new NotFoundException('No public projects found.');
    return projects;
  }

  /**
   * Get the total number of projects owned by a specific user.
   */
  @Get('owner/:owner_id/count')
  async countByOwner(@Param('owner_id') owner_id: number) {
    const count = await this.service.countProjectsByOwner(owner_id);
    return { owner_id: Number(owner_id), count };
  }

  /**
   * Retrieve all projects belonging to a specific owner.
   */
  @Get('owner/:owner_id')
  async findByOwner(@Param('owner_id') owner_id: number) {
    const projects = await this.service.getProjectsByOwner(owner_id);
    if (!projects || projects.length === 0)
      throw new NotFoundException('No projects found for this owner.');
    return projects;
  }

  /**
   * Retrieve a single project by its unique ID.
   */
  @Get(':id')
  async findById(@Param('id') id: number) {
    const project = await this.service.getProjectById(id);
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  /**
   * Create a new project.
   * Requires title, description, and owner_id.
   */
  @Post()
  async create(@Body() createDto: CreateProjectDto) {
    const { title, description, owner_id, is_public, tags } = createDto;

    if (!title || !description || !owner_id)
      throw new BadRequestException('Missing required fields.');

    return await this.service.createProject({
      title,
      description,
      owner_id,
      is_public,
      tags,
    });
  }

  /**
   * Update an existing project by ID.
   * Throws 404 if project not found.
   */
  @Put(':id')
  async update(@Param('id') id: number, @Body() updateDto: UpdateProjectDto) {
    if (!updateDto || Object.keys(updateDto).length === 0)
      throw new BadRequestException('No data provided for update.');

    const updated = await this.service.updateProject(id, updateDto);
    if (!updated) throw new NotFoundException('Project not found.');

    return { message: 'Project updated successfully', project: updated };
  }

  /**
   * Delete a project by its ID.
   * Throws 404 if not found.
   */
  @Delete(':id')
  async delete(@Param('id') id: number) {
    const success = await this.service.deleteProject(id);
    if (!success) throw new NotFoundException('Project not found.');

    return { message: 'Project deleted successfully' };
  }
}

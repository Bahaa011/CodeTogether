/**
 * ProjectService
 * ---------------
 * Handles all business logic for project management.
 * Supports creation, retrieval, updating, and deletion of projects,
 * as well as integration with the ProjectTagService for tag handling.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../user/user.entity';
import { UpdateProjectDto } from './dto/project.dto';
import { ProjectTagService } from '../project-tag/project-tag.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly projectTagService: ProjectTagService,
  ) {}

  /**
   * Create a new project and attach its tags if provided.
   */
  async createProject(params: {
    title: string;
    description: string;
    owner_id: number;
    is_public?: boolean;
    tags?: string[];
  }) {
    const { title, description, owner_id, is_public = false, tags } = params;

    const project = this.projectRepo.create({
      title,
      description,
      owner: { id: Number(owner_id) } as User,
      is_public,
    });

    const saved = await this.projectRepo.save(project);
    await this.projectTagService.replaceProjectTags(saved.id, tags);
    return await this.getProjectById(saved.id);
  }

  /**
   * Retrieve all projects (both public and private).
   * Includes owner, collaborators, and tags.
   */
  async getAllProjects() {
    return await this.projectRepo.find({
      relations: ['owner', 'collaborators', 'collaborators.user', 'tags'],
    });
  }

  /**
   * Retrieve all publicly visible projects.
   */
  async getPublicProjects() {
    return await this.projectRepo.find({
      where: { is_public: true },
      relations: ['owner', 'collaborators', 'collaborators.user', 'tags'],
    });
  }

  /**
   * Retrieve a single project by its ID.
   * Includes relations for owner, collaborators, and tags.
   */
  async getProjectById(id: number) {
    return await this.projectRepo.findOne({
      where: { id: Number(id) },
      relations: ['owner', 'collaborators', 'collaborators.user', 'tags'],
    });
  }

  /**
   * Retrieve all projects owned by a specific user.
   */
  async getProjectsByOwner(owner_id: number) {
    return await this.projectRepo.find({
      where: { owner: { id: Number(owner_id) } },
      relations: ['owner', 'collaborators', 'collaborators.user', 'tags'],
    });
  }

  /**
   * Count the number of projects owned by a user.
   */
  async countProjectsByOwner(owner_id: number) {
    return await this.projectRepo.count({
      where: { owner: { id: Number(owner_id) } },
    });
  }

  /**
   * Update a project and optionally update its tags.
   * Returns the updated project.
   */
  async updateProject(id: number, data: UpdateProjectDto) {
    const { tags, ...projectFields } = data;

    if (Object.keys(projectFields).length > 0) {
      await this.projectRepo.update(Number(id), projectFields);
    }

    await this.projectTagService.replaceProjectTags(Number(id), tags);
    return await this.getProjectById(Number(id));
  }

  /**
   * Delete a project by its ID.
   */
  async deleteProject(id: number) {
    return await this.projectRepo.delete(Number(id));
  }
}

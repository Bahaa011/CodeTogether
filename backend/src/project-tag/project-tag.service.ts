/**
 * ProjectTagService
 * -----------------
 * Handles business logic for project tag management.
 * Supports creation, retrieval, updates, deletion, and replacement of tags.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTag } from './project-tag.entity';
import { Project } from '../project/project.entity';

@Injectable()
export class ProjectTagService {
  constructor(
    @InjectRepository(ProjectTag)
    private readonly tagRepo: Repository<ProjectTag>,
  ) {}

  /**
   * Create a new tag linked to a specific project.
   */
  async create(tag: string, projectId: number) {
    const projectTag = this.tagRepo.create({
      tag,
      project: { id: Number(projectId) },
    });
    return await this.tagRepo.save(projectTag);
  }

  /**
   * Retrieve all tags across all projects.
   */
  async findAll() {
    return await this.tagRepo.find({ relations: ['project'] });
  }

  /**
   * Retrieve all tags for a specific project.
   */
  async findByProject(projectId: number) {
    return await this.tagRepo.find({
      where: { project: { id: Number(projectId) } },
      relations: ['project'],
    });
  }

  /**
   * Update the label of a tag by its ID.
   * Throws a 404 if the tag does not exist.
   */
  async update(id: number, tag?: string) {
    const projectTag = await this.tagRepo.findOne({
      where: { id: Number(id) },
      relations: ['project'],
    });
    if (!projectTag) throw new NotFoundException('Project tag not found.');
    if (tag) projectTag.tag = tag;
    return await this.tagRepo.save(projectTag);
  }

  /**
   * Remove a tag by its ID.
   * Returns true if deletion was successful.
   */
  async remove(id: number): Promise<boolean> {
    const result = await this.tagRepo.delete(Number(id));
    return (result.affected ?? 0) > 0;
  }

  /**
   * Replace all tags for a project with a new list.
   * Deletes old tags and inserts the new ones.
   */
  async replaceProjectTags(projectId: number, tags?: string[]) {
    if (tags === undefined) return;

    // Remove existing tags
    await this.tagRepo
      .createQueryBuilder()
      .delete()
      .from(ProjectTag)
      .where('projectId = :projectId', { projectId })
      .execute();

    const cleanTags = tags
      .map((tag) => tag?.trim())
      .filter((tag): tag is string => Boolean(tag));

    if (cleanTags.length === 0) return;

    // Insert new cleaned tags
    const rows = cleanTags.map((tag) =>
      this.tagRepo.create({
        tag,
        project: { id: Number(projectId) } as Project,
      }),
    );

    await this.tagRepo.save(rows);
  }
}

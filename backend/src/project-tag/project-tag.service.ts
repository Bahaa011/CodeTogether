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

  async create(tag: string, projectId: number) {
    const projectTag = this.tagRepo.create({
      tag,
      project: { id: Number(projectId) },
    });
    return await this.tagRepo.save(projectTag);
  }

  async findAll() {
    return await this.tagRepo.find({ relations: ['project'] });
  }

  async findByProject(projectId: number) {
    return await this.tagRepo.find({
      where: { project: { id: Number(projectId) } },
    });
  }

  async update(id: number, tag?: string) {
    const projectTag = await this.tagRepo.findOne({ where: { id: Number(id) } });
    if (!projectTag) throw new NotFoundException('Project tag not found.');
    if (tag) projectTag.tag = tag;
    return await this.tagRepo.save(projectTag);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.tagRepo.delete(Number(id));
    return (result.affected ?? 0) > 0;
  }

  async replaceProjectTags(projectId: number, tags?: string[]) {
    if (tags === undefined) {
      return;
    }

    await this.tagRepo
      .createQueryBuilder()
      .delete()
      .from(ProjectTag)
      .where('projectId = :projectId', { projectId })
      .execute();

    const cleanTags = tags
      .map((tag) => tag?.trim())
      .filter((tag): tag is string => Boolean(tag));

    if (cleanTags.length === 0) {
      return;
    }

    const rows = cleanTags.map((tag) =>
      this.tagRepo.create({
        tag,
        project: { id: Number(projectId) } as Project,
      }),
    );
    await this.tagRepo.save(rows);
  }
}

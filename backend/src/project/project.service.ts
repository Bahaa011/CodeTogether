import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Project } from './project.entity';
import { User } from '../user/user.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async createProject(
    title: string,
    description: string,
    owner_id: number,
    is_public = false,
  ) {
    const project = this.projectRepo.create({
      title,
      description,
      owner: { id: Number(owner_id) } as User,
      is_public,
    });
    return await this.projectRepo.save(project);
  }

  async getAllProjects() {
    return await this.projectRepo.find({
      relations: ['owner', 'collaborators', 'collaborators.user'],
    });
  }

  async getPublicProjects() {
    return await this.projectRepo.find({
      where: { is_public: true },
      relations: ['owner', 'collaborators', 'collaborators.user'],
    });
  }

  async getProjectById(id: number) {
    return await this.projectRepo.findOne({
      where: { id: Number(id) },
      relations: ['owner', 'collaborators', 'collaborators.user'],
    });
  }

  async getProjectsByOwner(owner_id: number) {
    return await this.projectRepo.find({
      where: { owner: { id: Number(owner_id) } },
      relations: ['owner', 'collaborators', 'collaborators.user'],
    });
  }

  async countProjectsByOwner(owner_id: number) {
    return await this.projectRepo.count({
      where: { owner: { id: Number(owner_id) } },
    });
  }

  async updateProject(id: number, data: QueryDeepPartialEntity<Project>) {
    await this.projectRepo.update(Number(id), data);
    return await this.getProjectById(Number(id));
  }

  async deleteProject(id: number) {
    return await this.projectRepo.delete(Number(id));
  }
}

/**
 * ProjectResolver
 * ---------------
 * Serves project queries/mutations and maps entities to GraphQL models.
 */
import { NotFoundException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProjectService } from './project.service';
import {
  CreateProjectInput,
  ProjectModel,
  ProjectCollaboratorInfo,
  ProjectCollaboratorUser,
  ProjectTagModel,
  UpdateProjectInput,
} from './dto/project.dto';
import { Project } from './project.entity';
import { ProjectTag } from '../project-tag/project-tag.entity';
import { Collaborator } from '../collaborator/collaborator.entity';
import { User } from '../user/user.entity';

@Resolver(() => ProjectModel)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  private mapTag(
    tag: ProjectTag | undefined,
    projectId?: number | null,
  ): ProjectTagModel | undefined {
    if (!tag) return undefined;
    return {
      id: tag.id,
      tag: tag.tag,
      project_id: projectId ?? tag.project?.id ?? null,
    };
  }

  private mapCollaboratorUser(
    user: User | undefined | null,
  ): ProjectCollaboratorUser | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url ?? null,
    };
  }

  private mapCollaborator(collaborator: Collaborator): ProjectCollaboratorInfo {
    return {
      id: collaborator.id,
      role: collaborator.role,
      user: this.mapCollaboratorUser(collaborator.user) ?? null,
    };
  }

  private mapProject(project: Project): ProjectModel {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      created_at: project.created_at,
      updated_at: project.updated_at,
      is_public: project.is_public,
      owner_id: project.owner?.id ?? project.ownerId ?? null,
      owner: project.owner ?? null,
      tags:
        project.tags
          ?.map((tag) => this.mapTag(tag, project.id))
          .filter((value): value is Exclude<typeof value, undefined> =>
            Boolean(value),
          ) ?? [],
      collaborators:
        project.collaborators?.map((collab) => this.mapCollaborator(collab)) ??
        [],
    };
  }

  /** List all projects (including non-public). */
  @Query(() => [ProjectModel])
  async projects() {
    const data = await this.projectService.getAllProjects();
    return data.map((project) => this.mapProject(project));
  }

  /** List only public projects. */
  @Query(() => [ProjectModel])
  async publicProjects() {
    const data = await this.projectService.getPublicProjects();
    return data.map((project) => this.mapProject(project));
  }

  /** Fetch a project by id. */
  @Query(() => ProjectModel)
  async project(@Args('id', { type: () => Int }) id: number) {
    const found = await this.projectService.getProjectById(id);
    if (!found) throw new NotFoundException('Project not found.');
    return this.mapProject(found);
  }

  /** Fetch projects owned by a specific user. */
  @Query(() => [ProjectModel])
  async projectsByOwner(@Args('ownerId', { type: () => Int }) ownerId: number) {
    const data = await this.projectService.getProjectsByOwner(ownerId);
    return data.map((project) => this.mapProject(project));
  }

  /** Count projects owned by a user. */
  @Query(() => Int)
  async projectCountByOwner(
    @Args('ownerId', { type: () => Int }) ownerId: number,
  ) {
    return this.projectService.countProjectsByOwner(ownerId);
  }

  /** Create a new project. */
  @Mutation(() => ProjectModel)
  async createProject(@Args('input') input: CreateProjectInput) {
    const created = await this.projectService.createProject(input);
    if (!created) throw new NotFoundException('Unable to create project.');
    return this.mapProject(created);
  }

  /** Update project fields and tags. */
  @Mutation(() => ProjectModel)
  async updateProject(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateProjectInput,
  ) {
    const updated = await this.projectService.updateProject(id, input);
    if (!updated) throw new NotFoundException('Project not found.');
    return this.mapProject(updated);
  }

  /** Delete a project by id. */
  @Mutation(() => Boolean)
  async deleteProject(@Args('id', { type: () => Int }) id: number) {
    const result = await this.projectService.deleteProject(id);
    return (result.affected ?? 0) > 0;
  }
}

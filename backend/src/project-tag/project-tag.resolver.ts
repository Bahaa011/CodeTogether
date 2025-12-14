import { NotFoundException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProjectTagService } from './project-tag.service';
import {
  CreateProjectTagInput,
  UpdateProjectTagInput,
} from './dto/project-tag.dto';
import { ProjectTagModel } from '../project/dto/project.dto';
import { ProjectTag } from './project-tag.entity';

@Resolver(() => ProjectTagModel)
export class ProjectTagResolver {
  constructor(private readonly projectTagService: ProjectTagService) {}

  private mapTag(tag: ProjectTag, overrideProjectId?: number): ProjectTagModel {
    return {
      id: tag.id,
      tag: tag.tag,
      project_id: overrideProjectId ?? tag.project?.id ?? 0,
    };
  }

  @Query(() => [ProjectTagModel])
  async projectTags() {
    const tags = await this.projectTagService.findAll();
    return tags.map((tag) => this.mapTag(tag));
  }

  @Query(() => [ProjectTagModel])
  async projectTagsByProject(
    @Args('projectId', { type: () => Int }) projectId: number,
  ) {
    const tags = await this.projectTagService.findByProject(projectId);
    return tags.map((tag) => this.mapTag(tag, projectId));
  }

  @Mutation(() => ProjectTagModel)
  async createProjectTag(@Args('input') input: CreateProjectTagInput) {
    const created = await this.projectTagService.create(
      input.tag,
      input.projectId,
    );
    return this.mapTag(created, input.projectId);
  }

  @Mutation(() => ProjectTagModel)
  async updateProjectTag(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateProjectTagInput,
  ) {
    const updated = await this.projectTagService.update(id, input.tag);
    if (!updated) throw new NotFoundException('Project tag not found.');
    return this.mapTag(updated);
  }

  @Mutation(() => Boolean)
  async deleteProjectTag(@Args('id', { type: () => Int }) id: number) {
    return this.projectTagService.remove(id);
  }
}

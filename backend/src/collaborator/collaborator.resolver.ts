/**
 * CollaboratorResolver
 * --------------------
 * Handles collaborator queries/mutations and maps entities to GraphQL models.
 */
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CollaboratorService } from './collaborator.service';
import { Collaborator } from './collaborator.entity';
import {
  CollaboratorActionResponse,
  CollaboratorModel,
  CreateCollaboratorInput,
  InviteCollaboratorInput,
  RespondCollaboratorInviteInput,
  UpdateCollaboratorRoleInput,
} from './dto/collaborator.dto';
import { Project } from '../project/project.entity';
import { ProjectTag } from '../project-tag/project-tag.entity';
import { User } from '../user/user.entity';

@Resolver(() => CollaboratorModel)
export class CollaboratorResolver {
  constructor(private readonly collaboratorService: CollaboratorService) {}

  private mapProjectTag(tag: ProjectTag | undefined) {
    if (!tag) return undefined;
    return {
      id: tag.id,
      tag: tag.tag,
    };
  }

  private mapUser(user: User | undefined | null) {
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url ?? null,
    };
  }

  private mapProject(project: Project | undefined | null) {
    if (!project) return undefined;
    const tags =
      project.tags
        ?.map((tag) => this.mapProjectTag(tag))
        .filter((value): value is Exclude<typeof value, undefined> =>
          Boolean(value),
        ) ?? [];

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      is_public: project.is_public,
      updated_at: project.updated_at,
      owner_id: project.owner?.id ?? project.ownerId ?? null,
      owner: this.mapUser(project.owner) ?? null,
      tags,
    };
  }

  private mapCollaborator(collab: Collaborator): CollaboratorModel {
    return {
      id: collab.id,
      role: collab.role,
      added_at: collab.added_at,
      user: this.mapUser(collab.user) ?? null,
      project: this.mapProject(collab.project) ?? null,
    };
  }

  /** List all collaborators across projects. */
  @Query(() => [CollaboratorModel])
  async collaborators() {
    const collabs = await this.collaboratorService.getAllCollaborators();
    return collabs.map((collab) => this.mapCollaborator(collab));
  }

  /** List collaborators for a specific project. */
  @Query(() => [CollaboratorModel])
  async collaboratorsByProject(
    @Args('projectId', { type: () => Int }) projectId: number,
  ) {
    const collabs =
      await this.collaboratorService.getCollaboratorsByProject(projectId);
    return collabs.map((collab) => this.mapCollaborator(collab));
  }

  /** List collaborations a user participates in. */
  @Query(() => [CollaboratorModel])
  async collaboratorsByUser(
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    const collabs =
      await this.collaboratorService.getCollaboratorsByUser(userId);
    return collabs.map((collab) => this.mapCollaborator(collab));
  }

  /** Count collaborations for a user. */
  @Query(() => Int)
  async collaborationCountByUser(
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    return this.collaboratorService.countCollaborationsByUser(userId);
  }

  /** Add a collaborator to a project. */
  @Mutation(() => CollaboratorModel)
  async addCollaborator(@Args('input') input: CreateCollaboratorInput) {
    const collab = await this.collaboratorService.addCollaborator(
      input.userId,
      input.projectId,
      input.role,
    );
    return this.mapCollaborator(collab);
  }

  /** Update a collaborator's role. */
  @Mutation(() => CollaboratorModel)
  async updateCollaboratorRole(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateCollaboratorRoleInput,
  ) {
    const collab = await this.collaboratorService.updateCollaboratorRole(
      id,
      input.role,
    );
    return this.mapCollaborator(collab);
  }

  /** Remove a collaborator from a project. */
  @Mutation(() => Boolean)
  async removeCollaborator(@Args('id', { type: () => Int }) id: number) {
    return this.collaboratorService.removeCollaborator(id);
  }

  /** Send a collaborator invite. */
  @Mutation(() => CollaboratorActionResponse)
  async inviteCollaborator(@Args('input') input: InviteCollaboratorInput) {
    return this.collaboratorService.inviteCollaborator(
      input.inviterId,
      input.projectId,
      input.inviteeIdentifier,
    );
  }

  /** Accept or decline a collaborator invite. */
  @Mutation(() => CollaboratorActionResponse)
  async respondToCollaboratorInvite(
    @Args('notificationId', { type: () => Int }) notificationId: number,
    @Args('input') input: RespondCollaboratorInviteInput,
  ) {
    return this.collaboratorService.respondToInvite(
      notificationId,
      input.userId,
      input.accept,
    );
  }
}

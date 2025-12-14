import { NotFoundException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SessionService } from './session.service';
import {
  CreateSessionInput,
  ProjectSessionModel,
  SessionProjectInfo,
  SessionUserInfo,
} from './dto/session.dto';
import { Session } from './session.entity';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';

@Resolver(() => ProjectSessionModel)
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  private mapUser(user?: User | null): SessionUserInfo | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username ?? null,
      email: user.email ?? null,
      avatar_url: user.avatar_url ?? null,
    };
  }

  private mapProject(project?: Project | null): SessionProjectInfo | undefined {
    if (!project) return undefined;
    return {
      id: project.id,
      title: project.title ?? null,
      description: project.description ?? null,
    };
  }

  private mapSession(session: Session): ProjectSessionModel {
    return {
      id: session.id,
      status: session.status,
      started_at: session.started_at,
      ended_at: session.ended_at ?? null,
      last_activity: session.last_activity ?? null,
      session_token: session.session_token ?? null,
      user: this.mapUser(session.user) ?? null,
      project: this.mapProject(session.project) ?? null,
    };
  }

  @Query(() => [ProjectSessionModel])
  async activeSessionsByProject(
    @Args('projectId', { type: () => Int }) projectId: number,
  ) {
    const sessions =
      await this.sessionService.getActiveSessionsByProject(projectId);
    return sessions.map((session) => this.mapSession(session));
  }

  @Query(() => Int)
  async longSessionCountByUser(
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    return this.sessionService.countLongSessions(userId);
  }

  @Mutation(() => ProjectSessionModel)
  async startSession(@Args('input') input: CreateSessionInput) {
    const created = await this.sessionService.createSession(
      input.userId,
      input.projectId,
    );
    const withRelations =
      (await this.sessionService.getSessionById(created.id)) ?? created;
    return this.mapSession(withRelations);
  }

  @Mutation(() => Boolean)
  async endSession(@Args('sessionId', { type: () => Int }) sessionId: number) {
    const result = await this.sessionService.endSession(sessionId);
    if (result?.error) throw new NotFoundException(result.error);
    return true;
  }
}

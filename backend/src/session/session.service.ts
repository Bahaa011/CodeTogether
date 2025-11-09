import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Session } from './session.entity';

const SESSION_STALE_MS = (() => {
  const parsed = Number(process.env.SESSION_STALE_MS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 60 * 1000; // default 60 seconds
})();

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  // Create new session (project level)
  async createSession(userId: number, projectId: number) {
    const now = new Date();
    await this.expireInactiveSessions(projectId);

    const activeSession = await this.sessionRepo.findOne({
      where: {
        user: { id: Number(userId) },
        project: { id: Number(projectId) },
        status: 'active',
        ended_at: IsNull(),
      },
    });

    if (activeSession) {
      activeSession.last_activity = now;
      return this.sessionRepo.save(activeSession);
    }

    const session = this.sessionRepo.create({
      user: { id: Number(userId) },
      project: { id: Number(projectId) },
      status: 'active',
      session_token: uuidv4(),
      started_at: now,
      last_activity: now,
    });
    return this.sessionRepo.save(session);
  }

  // Get active sessions for a user
  async getActiveSessions(userId: number) {
    await this.expireInactiveSessions();
    return this.sessionRepo.find({
      where: {
        user: { id: Number(userId) },
        status: 'active',
        ended_at: IsNull(),
      },
      relations: ['project'],
    });
  }

  async getActiveSessionsByProject(projectId: number) {
    await this.expireInactiveSessions(projectId);
    return this.sessionRepo.find({
      where: {
        project: { id: Number(projectId) },
        status: 'active',
        ended_at: IsNull(),
      },
      relations: ['user'],
      order: { last_activity: 'DESC' },
    });
  }

  // End session
  async endSession(sessionId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: Number(sessionId) } });
    if (!session) return { error: 'Session not found' };

    session.status = 'ended';
    session.ended_at = new Date();
    session.last_activity = new Date();
    await this.sessionRepo.save(session);
    return { message: 'Session ended', session };
  }

  // Get session by ID
  async getSessionById(id: number) {
    return await this.sessionRepo.findOne({
      where: { id: Number(id) },
      relations: ['user', 'project'],
    });
  }

  async markSessionActivity(sessionId: number) {
    await this.sessionRepo.update(
      { id: Number(sessionId), status: 'active', ended_at: IsNull() },
      { last_activity: new Date() },
    );
  }

  async countLongSessions(userId: number, minDurationMs = 15 * 60_000) {
    const minSeconds = Math.max(1, Math.floor(minDurationMs / 1000));
    const query = this.sessionRepo
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId: Number(userId) })
      .andWhere('session.status = :status', { status: 'ended' })
      .andWhere('session.started_at IS NOT NULL')
      .andWhere('session.ended_at IS NOT NULL')
      .andWhere(
        "EXTRACT(EPOCH FROM (session.ended_at - session.started_at)) >= :minSeconds",
        { minSeconds },
      );
    return query.getCount();
  }

  private async expireInactiveSessions(projectId?: number) {
    const cutoff = new Date(Date.now() - SESSION_STALE_MS);
    const builder = this.sessionRepo
      .createQueryBuilder()
      .update(Session)
      .set({ status: 'ended', ended_at: new Date(), last_activity: new Date() })
      .where('status = :status', { status: 'active' })
      .andWhere('ended_at IS NULL')
      .andWhere('last_activity < :cutoff', { cutoff });
    if (projectId) {
      builder.andWhere('projectId = :projectId', { projectId });
    }
    await builder.execute();
  }
}

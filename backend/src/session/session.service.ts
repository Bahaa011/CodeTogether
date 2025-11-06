import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { File } from '../file/file.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  // Create new session
  async createSession(userId: number, projectId: number, fileId: number) {
    const session = this.sessionRepo.create({
      user: { id: Number(userId) },
      project: { id: Number(projectId) },
      file: { id: Number(fileId) },
      status: 'active',
      session_token: uuidv4(),
    });
    return await this.sessionRepo.save(session);
  }

  // Get active sessions for a user
  async getActiveSessions(userId: number) {
    return await this.sessionRepo.find({
      where: { user: { id: Number(userId) }, status: 'active' },
      relations: ['project', 'file'],
    });
  }

  // End session
  async endSession(sessionId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: Number(sessionId) } });
    if (!session) return { error: 'Session not found' };

    session.status = 'ended';
    session.ended_at = new Date();
    await this.sessionRepo.save(session);
    return { message: 'Session ended', session };
  }

  // Get session by ID
  async getSessionById(id: number) {
    return await this.sessionRepo.findOne({
      where: { id: Number(id) },
      relations: ['user', 'project', 'file'],
    });
  }
}

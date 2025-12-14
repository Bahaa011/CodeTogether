/**
 * Session Entity
 * ---------------
 * Represents a user's active or past editing session within a project.
 * Tracks session status, timing, and related versions.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { Version } from '../version/version.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number; // Primary key

  @ManyToOne(() => Project, (project) => project.sessions, {
    onDelete: 'CASCADE',
  })
  project: Project; // Project this session belongs to

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User; // User participating in this session

  @Column({
    type: 'enum',
    enum: ['active', 'ended', 'idle'],
    default: 'active',
  })
  status: 'active' | 'ended' | 'idle'; // Current session state

  @CreateDateColumn()
  started_at: Date; // Timestamp when the session began

  @Column({ type: 'timestamp', nullable: true })
  ended_at: Date; // Timestamp when the session ended

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  last_activity: Date; // Last recorded user activity time

  @Column({ unique: true })
  session_token: string; // Unique token for identifying session

  @OneToMany(() => Version, (version) => version.session)
  versions: Version[]; // Versions created during this session
}

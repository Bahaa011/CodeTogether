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
  id: number;

  @ManyToOne(() => Project, (project) => project.sessions, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: ['active', 'ended', 'idle'], default: 'active' })
  status: 'active' | 'ended' | 'idle';

  @CreateDateColumn()
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  ended_at: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  last_activity: Date;

  @Column({ unique: true })
  session_token: string;

  @OneToMany(() => Version, (version) => version.session)
  versions: Version[];
}

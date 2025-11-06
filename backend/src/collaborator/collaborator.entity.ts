import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';

@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'editor' })
  role: string;

  @CreateDateColumn()
  added_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.collaborations, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Project, (project) => project.collaborators, { onDelete: 'CASCADE' })
  project: Project;
}

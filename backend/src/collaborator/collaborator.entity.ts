/**
 * Collaborator Entity
 * --------------------
 * Represents a user's participation in a project.
 * Stores the collaborator's role, the associated user, and the linked project.
 */

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
  id: number; // Primary key

  @Column({ default: 'editor' })
  role: string; // Role of the collaborator (e.g., owner, editor, viewer)

  @CreateDateColumn()
  added_at: Date; // Timestamp when the collaborator was added

  // ---------- Relations ----------

  @ManyToOne(() => User, (user) => user.collaborations, { onDelete: 'CASCADE' })
  user: User; // The user participating in the project

  @ManyToOne(() => Project, (project) => project.collaborators, { onDelete: 'CASCADE' })
  project: Project; // The project to which the user is collaborating
}

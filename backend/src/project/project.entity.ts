/**
 * Project Entity
 * ---------------
 * Represents a collaborative coding project within the CodeTogether platform.
 * Each project is owned by a user and can have collaborators, files, sessions and tags.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Collaborator } from '../collaborator/collaborator.entity';
import { File } from '../file/file.entity';
import { Session } from '../session/session.entity';
import { ProjectTag } from '../project-tag/project-tag.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number; // Primary key

  @Column()
  title: string; // Project title

  @Column('text')
  description: string; // Detailed project description

  @CreateDateColumn()
  created_at: Date; // Timestamp when the project was created

  @UpdateDateColumn()
  updated_at: Date; // Timestamp when the project was last updated

  @Column({ default: false })
  is_public: boolean; // Visibility flag (public or private)

  // ---------- Relations ----------

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User; // Owner of the project

  @RelationId((project: Project) => project.owner)
  ownerId: number; // Direct reference to owner's ID

  @OneToMany(() => Collaborator, (collaborator) => collaborator.project)
  collaborators: Collaborator[]; // Collaborators participating in the project

  @OneToMany(() => File, (file) => file.project)
  files: File[]; // Files associated with the project

  @OneToMany(() => Session, (session) => session.project)
  sessions: Session[]; // Active or past sessions for this project

  @OneToMany(() => ProjectTag, (tag) => tag.project)
  tags: ProjectTag[]; // Tags used for categorization or labeling
}

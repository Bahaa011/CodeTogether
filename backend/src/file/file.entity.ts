/**
 * File Entity
 * ------------
 * Represents a single file within a project.
 * Stores file content, metadata, and its relationships with project, user and versions.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';
import { Version } from '../version/version.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: number; // Primary key

  @Column()
  filename: string; // Name of the file

  @Column()
  file_type: string; // File type or extension (e.g., .ts, .js, .py)

  @Column('text', { default: '' })
  content: string; // File content stored as text

  @CreateDateColumn()
  created_at: Date; // Timestamp when the file was created

  @UpdateDateColumn()
  updated_at: Date; // Timestamp when the file was last updated

  // ---------- Relations ----------

  @ManyToOne(() => Project, (project) => project.files, { onDelete: 'CASCADE' })
  project: Project; // Project this file belongs to

  @ManyToOne(() => User, (user) => user.files, { onDelete: 'SET NULL' })
  uploader: User; // User who uploaded or created the file

  @OneToMany(() => Version, (version) => version.file)
  versions: Version[]; // All saved versions of this file
}

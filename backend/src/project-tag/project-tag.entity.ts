/**
 * ProjectTag Entity
 * -----------------
 * Represents a tag associated with a project.
 * Tags help categorize or label projects for better organization and filtering.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';

@Entity('project_tags')
export class ProjectTag {
  @PrimaryGeneratedColumn()
  id: number; // Primary key

  @Column()
  tag: string; // Tag label text

  @CreateDateColumn()
  created_at: Date; // Timestamp when tag was created

  @UpdateDateColumn()
  updated_at: Date; // Timestamp when tag was last updated

  @ManyToOne(() => Project, (project) => project.tags, {
    onDelete: 'CASCADE',
  })
  project: Project; // The project this tag belongs to
}

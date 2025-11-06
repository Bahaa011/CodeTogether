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
  id: number;

  @Column()
  tag: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Project, (project) => project.tags, {
    onDelete: 'CASCADE',
  })
  project: Project;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { File } from '../file/file.entity';
import { Version } from '../version/version.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => Project, (project) => project.comments, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @ManyToOne(() => File, (file) => file.comments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  file: File | null;

  @ManyToOne(() => Version, (version) => version.comments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  version: Version | null;
}

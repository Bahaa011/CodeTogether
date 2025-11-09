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
import { Comment } from '../comment/comment.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  file_type: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.files, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, (user) => user.files, { onDelete: 'SET NULL' })
  uploader: User;

  @OneToMany(() => Version, (version) => version.file)
  versions: Version[];

  @OneToMany(() => Comment, (comment) => comment.file)
  comments: Comment[];

}

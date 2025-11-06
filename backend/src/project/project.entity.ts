import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, RelationId, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Collaborator } from '../collaborator/collaborator.entity';
import { File } from '../file/file.entity';
import { Session } from '../session/session.entity';
import { ProjectTag } from '../project-tag/project-tag.entity';
import { Comment } from '../comment/comment.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ default: false })
  is_public: boolean;

  // Relations
  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @RelationId((project: Project) => project.owner)
  ownerId: number;

  @OneToMany(() => Collaborator, (collaborator) => collaborator.project)
  collaborators: Collaborator[];

  @OneToMany(() => File, (file) => file.project)
  files: File[];

  @OneToMany(() => Session, (session) => session.project)
  sessions: Session[];

  @OneToMany(() => ProjectTag, (tag) => tag.project)
  tags: ProjectTag[];

  @OneToMany(() => Comment, (comment) => comment.project)
  comments: Comment[];
}

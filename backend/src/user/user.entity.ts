import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import { Project } from '../project/project.entity';
import { File } from '../file/file.entity';
import { Collaborator } from '../collaborator/collaborator.entity';
import { Session } from '../session/session.entity';
import { Version } from '../version/version.entity';
import { Notification } from '../notification/notification.entity';
import { Comment } from '../comment/comment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  bio: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'text' ,nullable: true })
  reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expiry: Date | null;

  @Column({ default: false })
  mfa_enabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfa_code: string | null;

  @Column({ type: 'timestamp', nullable: true })
  mfa_code_expires_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfa_pending_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  mfa_pending_token_expires_at: Date | null;

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => File, (file) => file.uploader)
  files: File[];

  @OneToMany(() => Collaborator, (collab) => collab.user)
  collaborations: Collaborator[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => Version, (version) => version.user)
  versions: Version[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications: Notification[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];
}

/**
 * User Entity
 * ------------
 * Represents a registered user in the CodeTogether platform.
 * Stores authentication, profile, and relationship data.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { File } from '../file/file.entity';
import { Collaborator } from '../collaborator/collaborator.entity';
import { Session } from '../session/session.entity';
import { Version } from '../version/version.entity';
import { Notification } from '../notification/notification.entity';
import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number; // Primary key

  @Field()
  @Column({ unique: true })
  username: string; // Unique display name

  @Field()
  @Column({ unique: true })
  email: string; // Unique user email

  @Column()
  password_hash: string; // Hashed password

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null; // Optional profile picture URL

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  bio: string | null; // Optional user bio

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  created_at: Date; // Auto-generated timestamp when user is created

  // Password reset fields
  @Column({ type: 'text', nullable: true })
  reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expiry: Date | null;

  // Multi-Factor Authentication fields
  @Field()
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

  // Relations
  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[]; // Projects owned by the user

  @OneToMany(() => File, (file) => file.uploader)
  files: File[]; // Files uploaded by the user

  @OneToMany(() => Collaborator, (collab) => collab.user)
  collaborations: Collaborator[]; // Collaborations the user is part of

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[]; // Active or past user sessions

  @OneToMany(() => Version, (version) => version.user)
  versions: Version[]; // File versions created by the user

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications: Notification[]; // Notifications received by the user
}

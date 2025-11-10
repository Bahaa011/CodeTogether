/**
 * Version Entity
 * ---------------
 * Represents a saved version of a file in the CodeTogether platform.
 * Each version stores its content, metadata, and relationships to file, user, and session.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { File } from '../file/file.entity';
import { User } from '../user/user.entity';
import { Session } from '../session/session.entity';

@Entity('versions')
export class Version {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => File, (file) => file.versions, { onDelete: 'CASCADE' })
  file: File; // The file this version belongs to

  @ManyToOne(() => User, (user) => user.versions, { onDelete: 'SET NULL', nullable: true })
  user: User; // User who created the version (nullable)

  @ManyToOne(() => Session, (session) => session.versions, { onDelete: 'SET NULL', nullable: true })
  session: Session; // Session during which this version was created (nullable)

  @Column({ type: 'text' })
  content: string; // File content snapshot for this version

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string | null; // Optional label or note for this version

  @Column()
  version_number: number; // Sequential version number

  @CreateDateColumn()
  created_at: Date; // Timestamp when version was created
}

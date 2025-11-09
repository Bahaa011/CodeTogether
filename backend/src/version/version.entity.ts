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
import { Comment } from '../comment/comment.entity';

@Entity('versions')
export class Version {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => File, (file) => file.versions, { onDelete: 'CASCADE' })
  file: File;

  @ManyToOne(() => User, (user) => user.versions, { onDelete: 'SET NULL', nullable: true })
  user: User;

  @ManyToOne(() => Session, (session) => session.versions, { onDelete: 'SET NULL', nullable: true })
  session: Session;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string | null;

  @Column()
  version_number: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Comment, (comment) => comment.version)
  comments: Comment[];
}

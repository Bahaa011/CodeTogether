/**
 * Notification Entity
 * --------------------
 * Represents a user notification within the system.
 * Stores message content, type, metadata, and read status.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number; // Primary key

  @Column()
  message: string; // Notification message text

  @Column({ default: 'info' })
  type: string; // Notification type (e.g., info, warning, alert)

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null; // Optional extra data

  @Column({ default: false })
  is_read: boolean; // Indicates if the notification has been read

  @CreateDateColumn()
  created_at: Date; // Timestamp when the notification was created

  @UpdateDateColumn()
  updated_at: Date; // Timestamp when the notification was last updated

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null; // Timestamp when the notification was marked as read

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  recipient: User; // User who received the notification
}

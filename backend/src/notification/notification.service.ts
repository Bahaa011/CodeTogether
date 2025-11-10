/**
 * NotificationService
 * --------------------
 * Handles the business logic for managing user notifications.
 * Supports creation, retrieval, updating read status, and deletion.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  /**
   * Create a new notification for a recipient.
   */
  async createNotification(
    recipientId: number,
    message: string,
    type: string = 'info',
    metadata: Record<string, unknown> | null = null,
  ) {
    const notification = this.notificationRepo.create({
      recipient: { id: Number(recipientId) },
      message,
      type,
      metadata,
    });
    return await this.notificationRepo.save(notification);
  }

  /**
   * Retrieve all notifications for a specific user, ordered by newest first.
   */
  async getNotificationsForUser(userId: number) {
    return await this.notificationRepo.find({
      where: { recipient: { id: Number(userId) } },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Retrieve a notification by its ID.
   * Throws a 404 error if not found.
   */
  async getNotificationById(id: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: Number(id) },
      relations: ['recipient'],
    });
    if (!notification) throw new NotFoundException('Notification not found.');
    return notification;
  }

  /**
   * Update the read/unread status of a notification.
   * Also updates the `read_at` timestamp if marked as read.
   */
  async markNotificationStatus(id: number, isRead: boolean) {
    const notification = await this.getNotificationById(id);
    notification.is_read = isRead;
    notification.read_at = isRead ? new Date() : null;
    return await this.notificationRepo.save(notification);
  }

  /**
   * Remove a notification by its ID.
   * Returns true if the deletion was successful.
   */
  async removeNotification(id: number): Promise<boolean> {
    const result = await this.notificationRepo.delete(Number(id));
    return (result.affected ?? 0) > 0;
  }

  /**
   * Find a pending collaboration invite notification for a specific project.
   * Returns the latest matching invite if found.
   */
  async findPendingCollaborationInvite(recipientId: number, projectId: number) {
    const invitations = await this.notificationRepo.find({
      where: {
        recipient: { id: Number(recipientId) },
        type: 'collaboration_invite',
      },
      order: { created_at: 'DESC' },
    });

    return invitations.find((invite) => {
      if (!invite.metadata) return false;
      const meta = invite.metadata as Record<string, unknown>;
      return (
        Number(meta.projectId) === Number(projectId) &&
        (meta.status === 'pending' ||
          meta.status === undefined ||
          meta.status === null)
      );
    });
  }

  /**
   * Save a notification entity (insert or update).
   */
  async saveNotification(notification: Notification) {
    return await this.notificationRepo.save(notification);
  }
}

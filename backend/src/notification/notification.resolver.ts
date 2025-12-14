import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import {
  CreateNotificationInput,
  NotificationModel,
  NotificationRecipientInfo,
  UpdateNotificationStatusInput,
} from './dto/notification.dto';
import { Notification } from './notification.entity';
import { User } from '../user/user.entity';

@Resolver(() => NotificationModel)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  private mapRecipient(
    user?: User | null,
  ): NotificationRecipientInfo | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username ?? null,
      email: user.email ?? null,
      avatar_url: user.avatar_url ?? null,
    };
  }

  private mapNotification(notification: Notification): NotificationModel {
    return {
      id: notification.id,
      message: notification.message,
      type: notification.type,
      metadata: notification.metadata ?? null,
      is_read: notification.is_read,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
      read_at: notification.read_at ?? null,
      recipient: this.mapRecipient(notification.recipient) ?? null,
    };
  }

  @Query(() => [NotificationModel])
  async notificationsByUser(
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    const data = await this.notificationService.getNotificationsForUser(userId);
    return data.map((notification) => this.mapNotification(notification));
  }

  @Query(() => NotificationModel)
  async notification(@Args('id', { type: () => Int }) id: number) {
    const found = await this.notificationService.getNotificationById(id);
    if (!found) throw new NotFoundException('Notification not found.');
    return this.mapNotification(found);
  }

  @Mutation(() => NotificationModel)
  async createNotification(@Args('input') input: CreateNotificationInput) {
    const created = await this.notificationService.createNotification(
      input.recipientId,
      input.message,
      input.type,
      input.metadata ?? null,
    );
    return this.mapNotification(created);
  }

  @Mutation(() => NotificationModel)
  async updateNotificationStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateNotificationStatusInput,
  ) {
    if (typeof input.is_read !== 'boolean') {
      throw new BadRequestException('is_read must be provided.');
    }
    const updated = await this.notificationService.markNotificationStatus(
      id,
      input.is_read,
    );
    if (!updated) throw new NotFoundException('Notification not found.');
    return this.mapNotification(updated);
  }

  @Mutation(() => Boolean)
  async deleteNotification(@Args('id', { type: () => Int }) id: number) {
    return this.notificationService.removeNotification(id);
  }
}

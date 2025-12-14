/**
 * NotificationModule
 * -------------------
 * Provides functionality for managing user notifications.
 * Handles creation, retrieval, updating, and deletion of notifications.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])], // Registers Notification entity
  providers: [NotificationService, NotificationResolver], // Contains notification business logic + GraphQL resolver
  exports: [NotificationService], // Makes the service reusable by other modules
})
export class NotificationModule {}

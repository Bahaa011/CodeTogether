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
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])], // Registers Notification entity
  controllers: [NotificationController],               // Exposes REST API endpoints
  providers: [NotificationService],                    // Contains notification business logic
  exports: [NotificationService],                      // Makes the service reusable by other modules
})
export class NotificationModule {}

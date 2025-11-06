import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  UpdateNotificationStatusDto,
} from './dto/notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  async getForUser(@Param('userId') userId: number) {
    return await this.notificationService.getNotificationsForUser(userId);
  }

  @Get(':id')
  async getById(@Param('id') id: number) {
    return await this.notificationService.getNotificationById(id);
  }

  @Post()
  async create(@Body() createDto: CreateNotificationDto) {
    const { recipientId, message, type, metadata } = createDto;
    if (!recipientId || !message)
      throw new BadRequestException('Recipient and message are required.');
    return await this.notificationService.createNotification(
      recipientId,
      message,
      type,
      metadata ?? null,
    );
  }

  @Put(':id')
  async updateStatus(
    @Param('id') id: number,
    @Body() updateDto: UpdateNotificationStatusDto,
  ) {
    const { is_read } = updateDto;
    if (typeof is_read !== 'boolean')
      throw new BadRequestException('is_read must be provided.');
    return await this.notificationService.markNotificationStatus(id, is_read);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const removed = await this.notificationService.removeNotification(id);
    if (!removed) throw new NotFoundException('Notification not found.');
    return { message: 'Notification removed successfully.' };
  }
}

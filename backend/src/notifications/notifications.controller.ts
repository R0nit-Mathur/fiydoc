import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('me')
  async getMyNotifications(@Request() req: any) {
    return this.notificationsService.getForUser('me', req.user);
  }

  @Post('me/read-all')
  async markMyAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead('me', req.user);
  }

  @Get('user/:userId')
  async getForUser(@Param('userId') userId: string, @Request() req: any) {
    return this.notificationsService.getForUser(userId, req.user);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user);
  }

  @Post('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string, @Request() req: any) {
    return this.notificationsService.markAllAsRead(userId, req.user);
  }
}


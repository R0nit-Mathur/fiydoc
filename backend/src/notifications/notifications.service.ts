import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getForUser(userId: string, currentUser: any) {
    const targetUserId = userId === 'me' ? currentUser.id : userId;
    if (currentUser.role !== Role.ADMIN && currentUser.id !== targetUserId) {
      throw new ForbiddenException('Cannot access another user’s notifications.');
    }

    return this.prisma.notification.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, currentUser: any) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (currentUser.role !== Role.ADMIN && currentUser.id !== notification.userId) {
      throw new ForbiddenException('Cannot modify another user’s notification.');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string, currentUser: any) {
    const targetUserId = userId === 'me' ? currentUser.id : userId;
    if (currentUser.role !== Role.ADMIN && currentUser.id !== targetUserId) {
      throw new ForbiddenException('Cannot modify another user’s notifications.');
    }

    return this.prisma.notification.updateMany({
      where: { userId: targetUserId, read: false },
      data: { read: true },
    });
  }

  async registerPushToken(userId: string, pushToken: string) {
    if (!pushToken || typeof pushToken !== 'string') return;
    const cleanToken = pushToken.trim();
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: cleanToken },
    });
  }

  async create(data: { userId: string; title: string; message: string; type: string; payload?: any }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        payload: data.payload || undefined,
      },
    });

    // Asynchronously dispatch push notification to phone's OS notification panel
    this.dispatchPushNotification(data.userId, data.title, data.message, data.type, data.payload).catch(
      (err) => console.warn('[notifications] Push dispatch error:', err?.message)
    );

    return notification;
  }

  private async dispatchPushNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    payload?: any
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true },
      });

      if (!user?.pushToken) return;

      const token = user.pushToken.trim();
      // Verify valid Expo push token format
      if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
        return;
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          sound: 'default',
          title,
          body,
          data: { ...payload, type },
          channelId: 'default',
          priority: 'high',
        }),
      });

      if (!response.ok) {
        console.warn('[notifications] Expo push service responded with HTTP', response.status);
      }
    } catch (err: any) {
      console.warn('[notifications] Failed to send push to device:', err?.message);
    }
  }
}


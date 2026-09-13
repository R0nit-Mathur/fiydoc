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

  async create(data: { userId: string; title: string; message: string; type: string }) {
    return this.prisma.notification.create({
      data,
    });
  }
}


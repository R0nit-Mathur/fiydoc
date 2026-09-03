import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getVerificationQueue() {
    return this.prisma.doctorVerification.findMany({
      where: {
        status: { in: [VerificationStatus.PENDING, VerificationStatus.INFO_REQUIRED, VerificationStatus.REGISTERED] },
      },
      include: {
        doctor: {
          include: { qualifications: true, clinic: true },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async reviewVerification(dto: {
    verificationId: string;
    adminUserId: string;
    action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
    rejectionReason?: string;
  }) {
    const existing = await this.prisma.doctorVerification.findUnique({
      where: { id: dto.verificationId },
      include: { doctor: { include: { user: true } } },
    });

    if (!existing) throw new NotFoundException('Verification request not found.');

    let newStatus: VerificationStatus = VerificationStatus.VERIFIED;
    if (dto.action === 'REJECT') newStatus = VerificationStatus.REJECTED;
    if (dto.action === 'REQUEST_INFO') newStatus = VerificationStatus.INFO_REQUIRED;

    const updated = await this.prisma.doctorVerification.update({
      where: { id: dto.verificationId },
      data: {
        status: newStatus,
        reviewedByUserId: dto.adminUserId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });

    // Notify doctor
    await this.prisma.notification.create({
      data: {
        userId: existing.doctor.userId,
        type: 'VERIFICATION_UPDATE',
        title: `Doctor Verification Update: ${newStatus}`,
        message:
          newStatus === VerificationStatus.VERIFIED
            ? 'Congratulations! Your medical credentials have been verified.'
            : `Status: ${newStatus}. ${dto.rejectionReason || 'Please review your documents.'}`,
      },
    });

    // Write audit log entry
    await this.prisma.auditLog.create({
      data: {
        actorUserId: dto.adminUserId,
        action: `VERIFICATION_${dto.action}`,
        targetType: 'DoctorVerification',
        targetId: dto.verificationId,
        metadata: { status: newStatus, reason: dto.rejectionReason },
      },
    });

    return updated;
  }

  async getAllUsers(search?: string) {
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { patient: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

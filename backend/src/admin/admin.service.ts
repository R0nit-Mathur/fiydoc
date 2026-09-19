import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VerificationStatus, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

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

  async getAllDoctors(filter?: { status?: string; search?: string }) {
    const andClauses: any[] = [];

    if (filter?.status) {
      if (filter.status === 'PENDING') {
        andClauses.push({
          OR: [
            { verification: { status: { in: [VerificationStatus.PENDING, VerificationStatus.REGISTERED, VerificationStatus.INFO_REQUIRED] } } },
            { verification: null },
          ],
        });
      } else {
        andClauses.push({
          verification: { status: filter.status as VerificationStatus },
        });
      }
    }

    if (filter?.search) {
      const q = filter.search.trim();
      andClauses.push({
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { specialization: { contains: q, mode: 'insensitive' } },
          { verification: { is: { registrationNumber: { contains: q, mode: 'insensitive' } } } },
          { clinic: { is: { name: { contains: q, mode: 'insensitive' } } } },
          { clinic: { is: { address: { contains: q, mode: 'insensitive' } } } },
          { user: { is: { email: { contains: q, mode: 'insensitive' } } } },
          { user: { is: { phone: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }

    const where: any = andClauses.length > 0 ? { AND: andClauses } : {};

    return this.prisma.doctor.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, phone: true, status: true, createdAt: true } },
        clinic: true,
        qualifications: true,
        verification: {
          include: {
            reviewedBy: { select: { id: true, email: true } },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async getDoctorDetail(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: true,
        clinic: true,
        qualifications: true,
        availabilities: true,
        verification: {
          include: {
            reviewedBy: { select: { id: true, email: true } },
          },
        },
        appointments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { patient: true },
        },
      },
    });

    if (!doctor) throw new NotFoundException('Doctor record not found.');
    return doctor;
  }

  async reviewVerification(dto: {
    verificationId?: string;
    doctorId?: string;
    adminUserId: string;
    action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND';
    rejectionReason?: string;
  }) {
    let existing = dto.verificationId
      ? await this.prisma.doctorVerification.findUnique({
          where: { id: dto.verificationId },
          include: { doctor: { include: { user: true } } },
        })
      : null;

    if (!existing && dto.doctorId) {
      existing = await this.prisma.doctorVerification.findFirst({
        where: { doctorId: dto.doctorId },
        include: { doctor: { include: { user: true } } },
      });
    }

    if (!existing && dto.doctorId) {
      // Auto-create verification record if doctor exists but verification was missing
      const doc = await this.prisma.doctor.findUnique({ where: { id: dto.doctorId } });
      if (doc) {
        existing = await this.prisma.doctorVerification.create({
          data: {
            doctorId: doc.id,
            registrationNumber: `NMC-${Date.now().toString().slice(-6)}`,
            registrationAuthority: 'National Medical Commission / State Council',
            status: VerificationStatus.PENDING,
          },
          include: { doctor: { include: { user: true } } },
        });
      }
    }

    if (!existing) throw new NotFoundException('Verification request or doctor record not found.');

    let newStatus: VerificationStatus = VerificationStatus.VERIFIED;
    if (dto.action === 'REJECT') newStatus = VerificationStatus.REJECTED;
    if (dto.action === 'REQUEST_INFO') newStatus = VerificationStatus.INFO_REQUIRED;
    if (dto.action === 'SUSPEND') newStatus = VerificationStatus.REJECTED;

    const updated = await this.prisma.doctorVerification.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        reviewedByUserId: dto.adminUserId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });

    // If suspended or revoked, update User status (non-fatal)
    if (dto.action === 'SUSPEND' && existing.doctor?.userId) {
      try {
        await this.prisma.user.update({
          where: { id: existing.doctor.userId },
          data: { status: 'SUSPENDED' },
        });
      } catch (err: any) {
        console.warn('[admin] User suspend failed (non-fatal):', err?.message);
      }
    }

    // Notify doctor with push notification (non-fatal)
    if (existing.doctor?.userId) {
      try {
        await this.notificationsService.create({
          userId: existing.doctor.userId,
          type: 'VERIFICATION_UPDATE',
          title: newStatus === VerificationStatus.VERIFIED ? '🎉 Credentials Verified & Approved!' : `Doctor Verification Update: ${newStatus}`,
          message:
            newStatus === VerificationStatus.VERIFIED
              ? 'Congratulations! Your medical credentials have been verified by administration. You are now discoverable to patients and live on FiYDoc.'
              : `Status: ${newStatus}. ${dto.rejectionReason || 'Please review your uploaded documents.'}`,
          payload: { status: newStatus, rejectionReason: dto.rejectionReason },
        });
      } catch (notifErr: any) {
        console.warn('[admin] Verification notification failed (non-fatal):', notifErr?.message);
      }
    }

    // Write audit log entry (non-fatal)
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: dto.adminUserId,
          action: `VERIFICATION_${dto.action}`,
          targetType: 'DoctorVerification',
          targetId: existing.id,
          metadata: { status: newStatus, reason: dto.rejectionReason, doctorId: existing.doctorId },
        },
      });
    } catch (auditErr: any) {
      console.warn('[admin] Verification auditLog failed (non-fatal):', auditErr?.message);
    }

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

  async getAuditLogs(take = 50) {
    return this.prisma.auditLog.findMany({
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        actor: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async getSystemStats() {
    const today = new Date().toISOString().slice(0, 10);
    const [totalDoctors, verifiedDoctors, pendingVerifications, totalPatients, totalAppointments, todayAppointments, recentAudits] =
      await Promise.all([
        this.prisma.doctor.count(),
        this.prisma.doctorVerification.count({ where: { status: VerificationStatus.VERIFIED } }),
        this.prisma.doctorVerification.count({
          where: { status: { in: [VerificationStatus.PENDING, VerificationStatus.INFO_REQUIRED, VerificationStatus.REGISTERED] } },
        }),
        this.prisma.patient.count(),
        this.prisma.appointment.count(),
        this.prisma.appointment.count({ where: { date: today } }),
        this.prisma.auditLog.count(),
      ]);

    return {
      totalUsers: totalDoctors + totalPatients,
      totalDoctors,
      verifiedDoctors,
      pendingDoctors: pendingVerifications,
      pendingVerifications,
      totalPatients,
      totalAppointments,
      todayAppointments,
      recentAudits,
    };
  }
}

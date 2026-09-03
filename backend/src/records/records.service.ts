import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async getPatientTimeline(patientId: string, currentUser: any) {
    if (currentUser.role === Role.PATIENT && currentUser.patient?.id !== patientId) {
      throw new ForbiddenException('Cannot access another patient’s medical records.');
    }

    if (currentUser.role === Role.DOCTOR) {
      // Check if doctor has an active/past appointment with this patient
      const hasRelationship = await this.prisma.appointment.findFirst({
        where: {
          patientId,
          doctorId: currentUser.doctor?.id,
        },
      });
      if (!hasRelationship) {
        throw new ForbiddenException('Doctor does not have authorized consultation access to this patient’s history.');
      }
    }

    return this.prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadRecord(dto: { patientId: string; title: string; documentUrl: string; summary?: string; tags?: string[] }) {
    return this.prisma.medicalRecord.create({
      data: {
        patientId: dto.patientId,
        title: dto.title,
        type: 'UPLOADED_DOCUMENT',
        documentUrl: dto.documentUrl,
        summary: dto.summary,
        tags: dto.tags || [],
      },
    });
  }
}

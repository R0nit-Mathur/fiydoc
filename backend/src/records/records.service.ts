import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, MedicalRecordType } from '@prisma/client';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async resolvePatientId(patientId: string, currentUser?: any): Promise<string> {
    if (patientId === 'me' && currentUser?.id) {
      const userPatient = await this.prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!userPatient) throw new NotFoundException('Patient record not found for user.');
      return userPatient.id;
    }

    if (patientId) {
      const p = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (p) return p.id;
      // Also check if patientId is a userId
      const userPatient = await this.prisma.patient.findUnique({ where: { userId: patientId } });
      if (userPatient) return userPatient.id;
    }

    throw new NotFoundException('Patient record not found.');
  }

  async getPatientTimeline(patientId: string, currentUser: any) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required.');
    }

    const resolvedId = await this.resolvePatientId(patientId, currentUser);

    if (currentUser.role === Role.PATIENT) {
      const userPatient = await this.prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!userPatient || userPatient.id !== resolvedId) {
        throw new ForbiddenException('Cannot access another patient’s medical records.');
      }
    }

    if (currentUser.role === Role.DOCTOR) {
      const doc = await this.prisma.doctor.findUnique({ where: { userId: currentUser.id } });
      if (!doc) {
        throw new ForbiddenException('Doctor profile not found.');
      }

      // Doctor can only access records if there is an active/completed clinical encounter
      const hasRelationship = await this.prisma.appointment.findFirst({
        where: {
          patientId: resolvedId,
          doctorId: doc.id,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      });

      if (!hasRelationship) {
        throw new ForbiddenException(
          'You are not authorized to view this patient’s medical records without an active or completed appointment relationship.',
        );
      }
    }

    return this.prisma.medicalRecord.findMany({
      where: { patientId: resolvedId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRecord(
    dto: {
      patientId?: string;
      title: string;
      type?: string;
      documentUrl?: string;
      summary?: string;
      tags?: string[];
    },
    currentUser: any,
  ) {
    if (!currentUser) throw new ForbiddenException('Authentication required.');

    let targetPatientId = dto.patientId;
    if (!targetPatientId || targetPatientId === 'me') {
      const p = await this.prisma.patient.findFirst({
        where: { userId: currentUser.id },
      });
      if (!p) throw new NotFoundException('Patient record not found.');
      targetPatientId = p.id;
    } else {
      targetPatientId = await this.resolvePatientId(targetPatientId, currentUser);
    }

    let typeEnum: MedicalRecordType = MedicalRecordType.UPLOADED_DOCUMENT;
    if (dto.type?.toLowerCase().includes('prescription')) {
      typeEnum = MedicalRecordType.PRESCRIPTION;
    } else if (dto.type?.toLowerCase().includes('consultation')) {
      typeEnum = MedicalRecordType.CONSULTATION;
    }

    return this.prisma.medicalRecord.create({
      data: {
        patientId: targetPatientId,
        title: dto.title.trim(),
        type: typeEnum,
        documentUrl: dto.documentUrl || null,
        summary: dto.summary || null,
        tags: dto.tags || ['UPLOADED_DOCUMENT'],
      },
    });
  }
}



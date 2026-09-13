import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

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

      // Doctor can only access records if there is an active/previous clinical encounter
      const hasRelationship = await this.prisma.appointment.findFirst({
        where: {
          patientId: resolvedId,
          doctorId: doc.id,
        },
      });

      if (!hasRelationship) {
        throw new ForbiddenException(
          'You are not authorized to view this patient’s medical records without an appointment relationship.',
        );
      }
    }

    return this.prisma.medicalRecord.findMany({
      where: { patientId: resolvedId },
      orderBy: { createdAt: 'desc' },
    });
  }
}



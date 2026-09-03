import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, Role } from '@prisma/client';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateConsultation(dto: {
    appointmentId: string;
    chiefComplaint?: string;
    symptoms?: string[];
    observations?: string;
    assessment?: string;
    clinicalNotes?: any[];
    followUpDate?: string;
    completeNow?: boolean;
  }, currentUser: any) {
    const apt = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { doctor: true },
    });

    if (!apt) throw new NotFoundException('Appointment not found.');

    if (currentUser.role === Role.DOCTOR && currentUser.doctor?.id !== apt.doctorId) {
      throw new ForbiddenException('You are not authorized for this patient consultation.');
    }

    if (dto.completeNow && (!dto.assessment || dto.assessment.trim().length === 0)) {
      throw new BadRequestException('Complete Consultation requires at minimum a clinical assessment/diagnosis.');
    }

    const consultation = await this.prisma.consultation.upsert({
      where: { appointmentId: dto.appointmentId },
      create: {
        appointmentId: dto.appointmentId,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        chiefComplaint: dto.chiefComplaint,
        symptoms: dto.symptoms || [],
        observations: dto.observations,
        assessment: dto.assessment,
        clinicalNotes: dto.clinicalNotes || [],
        followUpDate: dto.followUpDate,
        completedAt: dto.completeNow ? new Date() : null,
      },
      update: {
        chiefComplaint: dto.chiefComplaint,
        symptoms: dto.symptoms,
        observations: dto.observations,
        assessment: dto.assessment,
        clinicalNotes: dto.clinicalNotes,
        followUpDate: dto.followUpDate,
        completedAt: dto.completeNow ? new Date() : undefined,
      },
    });

    if (dto.completeNow) {
      await this.prisma.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });

      // Automatically log MedicalRecord entry in patient timeline
      await this.prisma.medicalRecord.create({
        data: {
          patientId: apt.patientId,
          title: `Consultation with ${apt.doctor.fullName}`,
          type: 'CONSULTATION',
          sourceId: consultation.id,
          summary: `Assessment: ${dto.assessment}`,
          tags: dto.symptoms || [],
        },
      });
    }

    return consultation;
  }

  async getConsultationByAppointment(appointmentId: string) {
    return this.prisma.consultation.findUnique({
      where: { appointmentId },
      include: {
        prescription: {
          include: { medicines: true },
        },
        patient: true,
        doctor: true,
      },
    });
  }
}

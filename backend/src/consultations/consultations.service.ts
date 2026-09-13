import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, Role, VerificationStatus } from '@prisma/client';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateConsultation(
    dto: {
      appointmentId: string;
      chiefComplaint?: string;
      symptoms?: string[];
      observations?: string;
      assessment?: string;
      clinicalNotes?: any[];
      followUpDate?: string;
      completeNow?: boolean;
    },
    currentUser: any,
  ) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required.');
    }

    if (!dto.appointmentId) {
      throw new BadRequestException('appointmentId is required.');
    }

    const apt = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { doctor: { include: { verification: true } }, patient: true },
    });

    if (!apt) throw new NotFoundException('Appointment not found.');

    // Authorization: Only the assigned doctor or an admin can edit consultation records
    const isAssignedDoctor =
      currentUser.role === Role.DOCTOR && currentUser.doctor?.id === apt.doctorId;
    const isAdmin = currentUser.role === Role.ADMIN;

    if (!isAssignedDoctor && !isAdmin) {
      throw new ForbiddenException('You are not authorized to update this consultation.');
    }

    // Doctor credential verification: unverified doctors cannot conduct/complete clinical consultations
    if (currentUser.role === Role.DOCTOR) {
      if (apt.doctor?.verification?.status !== VerificationStatus.VERIFIED) {
        throw new ForbiddenException(
          'Only verified medical practitioners with approved credentials can record clinical consultations.',
        );
      }
    }

    if (dto.completeNow) {
      if (apt.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException(
          `Cannot complete consultation. Appointment is in '${apt.status}' status, but must be 'CONFIRMED' to conduct and finalize an encounter.`
        );
      }
      if (!dto.assessment || dto.assessment.trim().length === 0) {
        throw new BadRequestException('Complete Consultation requires at minimum a clinical assessment/diagnosis.');
      }
    }

    // Atomic transaction for core clinical operations
    const consultation = await this.prisma.$transaction(async (tx) => {
      const result = await tx.consultation.upsert({
        where: { appointmentId: dto.appointmentId },
        create: {
          appointmentId: dto.appointmentId,
          patientId: apt.patientId,
          doctorId: apt.doctorId,
          chiefComplaint: dto.chiefComplaint?.trim() || null,
          symptoms: dto.symptoms || [],
          observations: dto.observations?.trim() || null,
          assessment: dto.assessment?.trim() || null,
          clinicalNotes: dto.clinicalNotes || [],
          followUpDate: dto.followUpDate || null,
          completedAt: dto.completeNow ? new Date() : null,
        },
        update: {
          chiefComplaint: dto.chiefComplaint?.trim() || undefined,
          symptoms: dto.symptoms || undefined,
          observations: dto.observations?.trim() || undefined,
          assessment: dto.assessment?.trim() || undefined,
          clinicalNotes: dto.clinicalNotes || undefined,
          followUpDate: dto.followUpDate || undefined,
          completedAt: dto.completeNow ? new Date() : undefined,
        },
        include: { doctor: true, patient: true },
      });

      if (dto.completeNow) {
        // Atomic update of appointment status
        await tx.appointment.update({
          where: { id: dto.appointmentId },
          data: { status: AppointmentStatus.COMPLETED },
        });
      }

      return result;
    });

    if (dto.completeNow) {
      // Automatically create MedicalRecord entry in patient timeline (non-fatal)
      try {
        await this.prisma.medicalRecord.create({
          data: {
            patientId: apt.patientId,
            title: `Consultation with ${apt.doctor.fullName}`,
            type: 'CONSULTATION',
            sourceId: consultation.id,
            summary: `Assessment: ${dto.assessment?.trim()}`,
            tags: dto.symptoms || ['CLINICAL_CONSULTATION'],
          },
        });
      } catch (recErr: any) {
        console.warn('[consultations] MedicalRecord creation failed (non-fatal):', recErr?.message);
      }

      // Log audit trail (non-fatal)
      try {
        if (currentUser?.id) {
          await this.prisma.auditLog.create({
            data: {
              actorUserId: currentUser.id,
              action: 'CONSULTATION_COMPLETED',
              targetType: 'CONSULTATION',
              targetId: consultation.id,
              metadata: {
                appointmentId: apt.id,
                patientId: apt.patientId,
                doctorId: apt.doctorId,
              },
            },
          });
        }
      } catch (auditErr: any) {
        console.warn('[consultations] AuditLog insert failed (non-fatal):', auditErr?.message);
      }

      // Notify patient of consultation summary (non-fatal)
      try {
        if (apt.patient?.userId) {
          await this.prisma.notification.create({
            data: {
              userId: apt.patient.userId,
              type: 'CONSULTATION_COMPLETED',
              title: 'Consultation Completed',
              message: `Dr. ${apt.doctor.fullName} has finalized your consultation notes and clinical evaluation.`,
            },
          });
        }
      } catch (notifErr: any) {
        console.warn('[consultations] Notification creation failed (non-fatal):', notifErr?.message);
      }
    }

    return consultation;
  }

  async getConsultationByAppointment(appointmentId: string, currentUser: any) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required.');
    }

    const consultation = await this.prisma.consultation.findUnique({
      where: { appointmentId },
      include: {
        prescription: {
          include: { medicines: true },
        },
        patient: true,
        doctor: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation record not found for this appointment.');
    }

    // Actor Authorization check
    if (currentUser.role !== Role.ADMIN) {
      const isPatient = currentUser.patient && currentUser.patient.id === consultation.patientId;
      const isDoctor = currentUser.doctor && currentUser.doctor.id === consultation.doctorId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException('You do not have access to view this clinical consultation.');
      }
    }

    return {
      id: consultation.id,
      appointmentId: consultation.appointmentId,
      patientId: consultation.patientId,
      patientName: consultation.patient?.fullName || null,
      doctorId: consultation.doctorId,
      doctorName: consultation.doctor?.fullName || null,
      doctorSpecialty: consultation.doctor?.specialization || null,
      chiefComplaint: consultation.chiefComplaint,
      symptoms: consultation.symptoms,
      observations: consultation.observations,
      assessment: consultation.assessment,
      clinicalNotes: consultation.clinicalNotes,
      followUpDate: consultation.followUpDate,
      completedAt: consultation.completedAt,
      createdAt: consultation.createdAt,
      prescription: consultation.prescription
        ? {
            id: consultation.prescription.id,
            verificationCode: consultation.prescription.verificationCode,
            issuedAt: consultation.prescription.issuedAt || consultation.prescription.createdAt,
            doctorNotes: consultation.prescription.doctorNotes,
            followUpInstructions: consultation.prescription.followUpInstructions,
            medicines: consultation.prescription.medicines || [],
          }
        : null,
    };
  }
}


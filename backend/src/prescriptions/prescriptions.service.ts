import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async createPrescription(dto: {
    consultationId?: string;
    patientId?: string;
    doctorId?: string;
    doctorNotes?: string;
    followUpInstructions?: string;
    medicines?: {
      name: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
    }[];
    tests?: {
      name: string;
      category?: string;
    }[];
  }) {
    let consultation: any = null;

    // 1. Try finding consultation by ID
    if (dto.consultationId) {
      consultation = await this.prisma.consultation.findUnique({
        where: { id: dto.consultationId },
        include: { doctor: true, patient: true },
      });

      // 2. Try finding consultation by appointmentId
      if (!consultation) {
        consultation = await this.prisma.consultation.findUnique({
          where: { appointmentId: dto.consultationId },
          include: { doctor: true, patient: true },
        });
      }

      // 3. Try finding appointment by ID and auto-create consultation
      if (!consultation) {
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: dto.consultationId },
          include: { doctor: true, patient: true },
        });

        if (appointment) {
          consultation = await this.prisma.consultation.create({
            data: {
              appointmentId: appointment.id,
              patientId: appointment.patientId,
              doctorId: appointment.doctorId,
              assessment: dto.doctorNotes || 'OPD Consultation',
            },
            include: { doctor: true, patient: true },
          });
        }
      }
    }

    // 4. Fallback if no consultation or appointment found (e.g. ad-hoc or mobile offline ID)
    if (!consultation) {
      let doctor = dto.doctorId
        ? await this.prisma.doctor.findUnique({ where: { id: dto.doctorId } })
        : null;
      if (!doctor) {
        doctor = await this.prisma.doctor.findFirst();
      }

      let patient = dto.patientId
        ? await this.prisma.patient.findUnique({ where: { id: dto.patientId } })
        : null;
      if (!patient) {
        patient = await this.prisma.patient.findFirst();
      }

      if (doctor && patient) {
        const newApt = await this.prisma.appointment.create({
          data: {
            doctorId: doctor.id,
            patientId: patient.id,
            date: new Date().toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '10:30',
            fee: doctor.consultationFee || 800,
            status: 'COMPLETED',
          },
        });

        consultation = await this.prisma.consultation.create({
          data: {
            appointmentId: newApt.id,
            doctorId: doctor.id,
            patientId: patient.id,
            assessment: dto.doctorNotes || 'Clinical Evaluation',
          },
          include: { doctor: true, patient: true },
        });
      }
    }

    if (!consultation) {
      throw new NotFoundException('Could not link or create consultation for prescription.');
    }

    const verificationCode = `FYD-RX-${Math.floor(100000 + Math.random() * 900000)}-MH`;

    const prescription = await this.prisma.prescription.create({
      data: {
        consultationId: consultation.id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        doctorNotes: dto.doctorNotes,
        followUpInstructions: dto.followUpInstructions,
        verificationCode,
        signedAt: new Date(),
        pdfUrl: `https://api.fiydoc.app/prescriptions/pdf/${consultation.id}.pdf`,
        medicines: {
          create: (dto.medicines || []).map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            durationDays: m.durationDays || 5,
            instructions: m.instructions || '',
          })),
        },
      },
      include: { medicines: true, doctor: true, patient: true },
    });

    // Auto-create MedicalRecord entry in patient timeline
    await this.prisma.medicalRecord.create({
      data: {
        patientId: consultation.patientId,
        title: `Prescription from ${consultation.doctor.fullName}`,
        type: 'PRESCRIPTION',
        sourceId: prescription.id,
        documentUrl: prescription.pdfUrl,
        summary: `Prescribed ${(dto.medicines || []).length} medicine(s)`,
      },
    });

    // Notify patient
    if (consultation.patient?.userId) {
      await this.prisma.notification.create({
        data: {
          userId: consultation.patient.userId,
          type: 'PRESCRIPTION_ISSUED',
          title: 'Prescription Ready',
          message: `${consultation.doctor.fullName} has issued your digital prescription.`,
        },
      });
    }

    return prescription;
  }

  async getPrescriptionById(id: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: { medicines: true, doctor: true, patient: true },
    });
    if (!rx) throw new NotFoundException('Prescription not found');
    return rx;
  }

  async verifyPrescriptionCode(verificationCode: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { verificationCode },
      include: {
        doctor: { select: { fullName: true, specialization: true } },
        patient: { select: { fullName: true } },
        medicines: true,
      },
    });

    if (!rx) return { verified: false, message: 'Invalid or fraudulent prescription code.' };

    return {
      verified: true,
      doctorName: rx.doctor.fullName,
      specialization: rx.doctor.specialization,
      patientName: rx.patient.fullName,
      issuedAt: rx.createdAt,
      medicineCount: rx.medicines.length,
      verificationCode: rx.verificationCode,
    };
  }

  async getPrescriptionsForPatient(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      include: {
        medicines: true,
        doctor: {
          include: {
            clinic: true,
            verification: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

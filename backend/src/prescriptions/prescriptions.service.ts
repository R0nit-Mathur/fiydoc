import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async createPrescription(dto: {
    consultationId: string;
    medicines: {
      name: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
    }[];
    doctorNotes?: string;
    followUpInstructions?: string;
  }) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: dto.consultationId },
      include: { doctor: true, patient: true },
    });

    if (!consultation) throw new NotFoundException('Consultation not found.');

    const prescription = await this.prisma.prescription.create({
      data: {
        consultationId: dto.consultationId,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        doctorNotes: dto.doctorNotes,
        followUpInstructions: dto.followUpInstructions,
        signedAt: new Date(),
        pdfUrl: `https://api.fiydoc.app/prescriptions/pdf/${dto.consultationId}.pdf`,
        medicines: {
          create: dto.medicines.map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            durationDays: m.durationDays,
            instructions: m.instructions,
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
        summary: `Prescribed ${prescription.medicines.length} medicine(s)`,
      },
    });

    // Notify patient
    await this.prisma.notification.create({
      data: {
        userId: consultation.patient.userId,
        type: 'PRESCRIPTION_ISSUED',
        title: 'Prescription Ready',
        message: `${consultation.doctor.fullName} has issued your digital prescription.`,
      },
    });

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
}

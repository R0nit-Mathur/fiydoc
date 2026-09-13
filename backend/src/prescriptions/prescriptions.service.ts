import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Role, VerificationStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as crypto from 'crypto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  private buildPrescriptionDocument(prescription: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 48, size: 'A4' });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      pdf.fillColor('#3055A8').fontSize(22).text('FiYDoc Digital Prescription');
      pdf.fillColor('#52606D').fontSize(10).text(`Verification code: ${prescription.verificationCode}`);
      pdf.moveDown();
      pdf.fillColor('#172033').fontSize(11)
        .text(`Doctor: ${prescription.doctor.fullName}`)
        .text(`Patient: ${prescription.patient.fullName}`)
        .text(`Issued: ${new Date(prescription.createdAt).toLocaleString('en-IN')}`);
      pdf.moveDown().fontSize(13).fillColor('#3055A8').text('Medicines');
      pdf.moveDown(0.4).fontSize(10).fillColor('#172033');
      if (!prescription.medicines || prescription.medicines.length === 0) {
        pdf.text('No medicines prescribed.');
      } else {
        prescription.medicines.forEach((medicine: any, index: number) => {
          pdf.font('Helvetica-Bold').text(`${index + 1}. ${medicine.name}`);
          pdf.font('Helvetica').text(`${medicine.dosage} • ${medicine.frequency} • ${medicine.durationDays} days`);
          if (medicine.instructions) pdf.fillColor('#52606D').text(medicine.instructions).fillColor('#172033');
          pdf.moveDown(0.5);
        });
      }
      pdf.moveDown().fontSize(13).fillColor('#3055A8').text('Clinical notes');
      pdf.moveDown(0.4).fontSize(10).fillColor('#172033').text(prescription.doctorNotes || '—');
      pdf.moveDown().fontSize(13).fillColor('#3055A8').text('Follow-up');
      pdf.moveDown(0.4).fontSize(10).fillColor('#172033').text(prescription.followUpInstructions || 'As advised by your clinician.');
      pdf.end();
    });
  }

  async createPrescription(
    dto: {
      consultationId: string;
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
    },
    currentUser: any,
  ) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required to issue prescriptions.');
    }

    if (currentUser.role !== Role.DOCTOR && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only a licensed doctor or authorized admin can issue prescriptions.');
    }

    if (!dto.consultationId) {
      throw new BadRequestException('An existing consultationId is strictly required to issue a prescription.');
    }

    // Doctor must be verified by clinical authority to write prescriptions
    if (currentUser.role === Role.DOCTOR) {
      const docRecord = await this.prisma.doctor.findUnique({
        where: { id: currentUser.doctor?.id },
        include: { verification: true },
      });
      if (!docRecord) {
        throw new ForbiddenException('Doctor profile not found.');
      }
      if (docRecord.verification?.status !== VerificationStatus.VERIFIED) {
        throw new ForbiddenException('Only verified medical practitioners with active credentials can issue prescriptions.');
      }
    }

    // Require genuine, existing clinical consultation
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: dto.consultationId },
      include: { doctor: true, patient: true, appointment: true },
    });

    if (!consultation) {
      throw new NotFoundException('Specified clinical consultation does not exist.');
    }

    if (!consultation.completedAt || consultation.appointment?.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Prescriptions can only be issued for completed, finalized clinical consultations.'
      );
    }

    // Authenticated doctor must match the assigned consultation doctor
    if (currentUser.role === Role.DOCTOR && consultation.doctorId !== currentUser.doctor?.id) {
      throw new ForbiddenException('You cannot issue a prescription for another doctor’s patient encounter.');
    }

    // Validate medicine items
    if (dto.medicines) {
      for (const m of dto.medicines) {
        if (!m.name || m.name.trim().length === 0) {
          throw new BadRequestException('Every prescribed medicine must have a valid name.');
        }
        if (m.durationDays !== undefined && m.durationDays <= 0) {
          throw new BadRequestException('Prescription medicine duration must be at least 1 day.');
        }
      }
    }

    // Cryptographically secure verification code
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const verificationCode = `FYD-RX-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    return this.prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.create({
        data: {
          consultationId: consultation.id,
          patientId: consultation.patientId,
          doctorId: consultation.doctorId,
          doctorNotes: dto.doctorNotes,
          followUpInstructions: dto.followUpInstructions,
          verificationCode,
          signedAt: new Date(),
          medicines: {
            create: (dto.medicines || []).map((m) => ({
              name: m.name.trim(),
              dosage: m.dosage?.trim() || 'As directed',
              frequency: m.frequency?.trim() || 'Once daily',
              durationDays: m.durationDays || 5,
              instructions: m.instructions?.trim() || '',
            })),
          },
        },
        include: { medicines: true, doctor: true, patient: true },
      });

      let storagePath: string | null = null;
      let documentUrl: string | null = null;
      if (this.supabase.isConfigured()) {
        try {
          const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'fiydoc-medical-docs';
          storagePath = `prescriptions/${consultation.patientId}/${prescription.id}.pdf`;
          await this.supabase.uploadPrivateFile(
            bucket,
            storagePath,
            await this.buildPrescriptionDocument(prescription),
            'application/pdf',
          );
          await tx.prescription.update({
            where: { id: prescription.id },
            data: { pdfUrl: storagePath },
          });
          documentUrl = await this.supabase.createSignedUrl(bucket, storagePath, 3600).catch(() => null);
        } catch (storageErr) {
          // Keep prescription record even if PDF upload deferred
        }
      }

      // Auto-create timeline MedicalRecord entry
      await tx.medicalRecord.create({
        data: {
          patientId: consultation.patientId,
          title: `Prescription from ${consultation.doctor.fullName}`,
          type: 'PRESCRIPTION',
          sourceId: prescription.id,
          documentUrl: storagePath || undefined,
          summary: `Prescribed ${(dto.medicines || []).length} medicine(s)`,
          tags: ['DIGITAL_RX', 'OFFICIAL_PRESCRIPTION'],
        },
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          actorUserId: currentUser.id,
          action: 'PRESCRIPTION_ISSUED',
          targetType: 'PRESCRIPTION',
          targetId: prescription.id,
          metadata: {
            consultationId: consultation.id,
            patientId: consultation.patientId,
            medicineCount: (dto.medicines || []).length,
          },
        },
      });

      // Notify patient
      if (consultation.patient?.userId) {
        await tx.notification.create({
          data: {
            userId: consultation.patient.userId,
            type: 'PRESCRIPTION_ISSUED',
            title: 'Prescription Ready',
            message: `${consultation.doctor.fullName} has issued your digital prescription.`,
          },
        });
      }

      return { ...prescription, pdfUrl: documentUrl || storagePath };
    });
  }

  async getPrescriptionById(id: string, currentUser: any) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: { medicines: true, doctor: true, patient: true },
    });
    if (!rx) throw new NotFoundException('Prescription not found.');

    this.checkPrescriptionActorAccess(rx, currentUser);

    let signedUrl = rx.pdfUrl;
    if (rx.pdfUrl && this.supabase.isConfigured() && !rx.pdfUrl.startsWith('http')) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'fiydoc-medical-docs';
      try {
        signedUrl = await this.supabase.createSignedUrl(bucket, rx.pdfUrl, 3600);
      } catch (err) {
        // Fallback to stored path
      }
    }

    return { ...rx, pdfUrl: signedUrl };
  }

  async verifyPrescriptionCode(verificationCode: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { verificationCode: verificationCode.trim() },
      include: {
        doctor: { select: { fullName: true, specialization: true } },
        medicines: { select: { name: true } },
      },
    });

    if (!rx) {
      return { verified: false, message: 'Invalid or fraudulent prescription code.' };
    }

    // Minimum required verification info to protect PHI
    return {
      verified: true,
      doctorName: rx.doctor.fullName,
      specialization: rx.doctor.specialization,
      issuedAt: rx.createdAt,
      medicineCount: rx.medicines.length,
      verificationCode: rx.verificationCode,
    };
  }

  async getPrescriptionsForPatient(patientId: string, currentUser: any) {
    const targetPatientId =
      patientId === 'me' || patientId === currentUser.id
        ? currentUser.patient?.id
        : patientId;

    if (!targetPatientId) {
      throw new NotFoundException('Patient record not found.');
    }

    // Patient can only access own prescriptions
    if (currentUser.role === Role.PATIENT) {
      if (currentUser.patient?.id !== targetPatientId && currentUser.id !== targetPatientId) {
        throw new ForbiddenException('Cannot access another patient’s prescriptions.');
      }
    }

    // Doctor can only access prescriptions for patients with whom they have an encounter relationship
    if (currentUser.role === Role.DOCTOR) {
      const docId = currentUser.doctor?.id;
      if (!docId) {
        throw new ForbiddenException('Doctor profile not found.');
      }
      const hasEncounter = await this.prisma.appointment.findFirst({
        where: {
          patientId: targetPatientId,
          doctorId: docId,
        },
      });
      if (!hasEncounter) {
        throw new ForbiddenException('You are not authorized to view prescriptions for patients outside your practice.');
      }
    }

    return this.prisma.prescription.findMany({
      where: { patientId: targetPatientId },
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

  private checkPrescriptionActorAccess(rx: any, currentUser: any) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required.');
    }
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    const isPatient = currentUser.patient && currentUser.patient.id === rx.patientId;
    const isDoctor = currentUser.doctor && currentUser.doctor.id === rx.doctorId;

    if (!isPatient && !isDoctor) {
      throw new ForbiddenException('You do not have permission to view this prescription.');
    }
  }
}


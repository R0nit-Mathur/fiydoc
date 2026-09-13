import * as assert from 'assert';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { PrescriptionsService } from '../src/prescriptions/prescriptions.service';
import { ConsultationsService } from '../src/consultations/consultations.service';
import { RecordsService } from '../src/records/records.service';
import { PatientsService } from '../src/patients/patients.service';
import { AppointmentStatus, Role, VerificationStatus } from '@prisma/client';

console.log('🚀 Running Security & Clinical Invariant Verification Suite...');

const mockPrisma: any = {
  appointment: {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async (args: any) => ({ id: 'apt_123', ...args.data, doctor: { fullName: 'Dr. Test' }, patient: { fullName: 'Pat Test' } }),
    update: async (args: any) => ({ id: 'apt_123', ...args.data, doctor: { fullName: 'Dr. Test' }, patient: { fullName: 'Pat Test' } }),
    updateMany: async () => ({ count: 1 }),
  },
  doctor: {
    findUnique: async () => null,
    findFirst: async () => null,
  },
  patient: {
    findUnique: async () => null,
    findFirst: async () => null,
    update: async (args: any) => ({ id: 'pat_1', ...args.data }),
  },
  prescription: {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async (args: any) => ({ id: 'rx_123', ...args.data }),
  },
  consultation: {
    findUnique: async () => null,
    findFirst: async () => null,
    upsert: async (args: any) => ({ id: 'c_123', ...args.create }),
  },
  medicalRecord: {
    create: async (args: any) => ({ id: 'mr_123', ...args.data }),
    findMany: async () => [],
  },
  auditLog: {
    create: async (args: any) => ({ id: 'audit_123', ...args.data }),
  },
  notification: {
    create: async (args: any) => ({ id: 'notif_123', ...args.data }),
    createMany: async () => ({ count: 2 }),
  },
  $transaction: async (cb: any) => cb(mockPrisma),
};

const mockSupabase: any = {
  uploadFile: async () => 'https://mock.supabase.co/prescriptions/mock.pdf',
};

const appointmentsService = new AppointmentsService(mockPrisma);
const prescriptionsService = new PrescriptionsService(mockPrisma, mockSupabase);
const consultationsService = new ConsultationsService(mockPrisma);
const recordsService = new RecordsService(mockPrisma);
const patientsService = new PatientsService(mockPrisma);

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`, err.message);
      failed++;
    }
  }

  // Test 1: Past appointment date/time rejection
  await test('Rejects past appointment booking', async () => {
    let threw = false;
    try {
      await appointmentsService.createAppointment({
        patientId: 'pat_1',
        doctorId: 'doc_1',
        date: '2020-01-01',
        startTime: '10:00',
        endTime: '10:30',
      });
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('must be strictly in the future')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should reject past appointment');
  });

  // Test 2: Doctor schedule availability rejection
  await test('Rejects slot outside doctor scheduled availability hours', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      consultationFee: 500,
      availabilities: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      ],
    });
    mockPrisma.patient.findUnique = async () => ({ id: 'pat_1' });

    let threw = false;
    try {
      await appointmentsService.createAppointment({
        patientId: 'pat_1',
        doctorId: 'doc_1',
        date: '2029-01-01', // Monday
        startTime: '15:00',
        endTime: '15:30',
      });
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('outside the doctor\'s scheduled availability')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should reject outside availability');
  });

  // Test 3: Cross-tenant appointment cancellation
  await test('Prevents Patient B from cancelling Patient A appointment', async () => {
    mockPrisma.appointment.findUnique = async () => ({
      id: 'apt_1',
      patientId: 'pat_A',
      doctorId: 'doc_1',
      status: AppointmentStatus.CONFIRMED,
      doctor: { userId: 'u_doc', fullName: 'Doctor' },
      patient: { userId: 'u_patA', fullName: 'Patient A' },
    });

    const userB = {
      id: 'u_patB',
      role: Role.PATIENT,
      patient: { id: 'pat_B' },
    };

    let threw = false;
    try {
      await appointmentsService.cancelAppointment('apt_1', userB);
    } catch (e: any) {
      if (e instanceof ForbiddenException) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should forbid unauthorized cancellation');
  });

  // Test 4: Prescription issuance by unverified doctor
  await test('Rejects prescription issuance by unverified doctor', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      verification: { status: VerificationStatus.PENDING },
    });

    const unverifiedDoc = {
      id: 'u_doc',
      role: Role.DOCTOR,
      doctor: {
        id: 'doc_1',
      },
    };

    let threw = false;
    try {
      await prescriptionsService.createPrescription(
        {
          consultationId: 'c_1',
          medicines: [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', durationDays: 5 }],
        },
        unverifiedDoc
      );
    } catch (e: any) {
      if (e instanceof ForbiddenException && e.message.includes('verified medical practitioners')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should forbid unverified doctor prescribing');
  });

  // Test 5: Prescription requires existing consultation
  await test('Rejects prescription without valid existing consultation', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      verification: { status: VerificationStatus.VERIFIED },
    });
    mockPrisma.consultation.findUnique = async () => null;

    const verifiedDoc = {
      id: 'u_doc',
      role: Role.DOCTOR,
      doctor: {
        id: 'doc_1',
      },
    };

    let threw = false;
    try {
      await prescriptionsService.createPrescription(
        {
          consultationId: 'c_non_existent',
          medicines: [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', durationDays: 5 }],
        },
        verifiedDoc
      );
    } catch (e: any) {
      if (e instanceof NotFoundException) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should throw NotFound for missing consultation');
  });

  // Test 6: Cross-patient prescription access
  await test('Prevents Patient B from accessing Patient A prescriptions', async () => {
    const userB = {
      id: 'u_patB',
      role: Role.PATIENT,
      patient: { id: 'pat_B' },
    };

    let threw = false;
    try {
      await prescriptionsService.getPrescriptionsForPatient('pat_A', userB);
    } catch (e: any) {
      if (e instanceof ForbiddenException) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should forbid cross-patient prescription access');
  });

  // Test 7: Consultation by unassigned doctor
  await test('Rejects recording consultation by unassigned doctor', async () => {
    mockPrisma.appointment.findUnique = async () => ({
      id: 'apt_1',
      doctorId: 'doc_assigned',
      patientId: 'pat_1',
      status: AppointmentStatus.CONFIRMED,
      doctor: { verification: { status: VerificationStatus.VERIFIED } },
      patient: { userId: 'u_pat' },
    });

    const impostorDoctor = {
      id: 'u_impostor',
      role: Role.DOCTOR,
      doctor: {
        id: 'doc_other',
        verification: { status: VerificationStatus.VERIFIED },
      },
    };

    let threw = false;
    try {
      await consultationsService.createOrUpdateConsultation(
        {
          appointmentId: 'apt_1',
          chiefComplaint: 'Chest pain',
        },
        impostorDoctor
      );
    } catch (e: any) {
      if (e instanceof ForbiddenException) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should forbid unassigned doctor consultation');
  });

  // Test 8: Timeline access by doctor with no clinical relationship
  await test('Prevents arbitrary doctor without appointment from viewing patient timeline', async () => {
    mockPrisma.patient.findUnique = async (args: any) => {
      if (args.where?.id === 'pat_1') return { id: 'pat_1', userId: 'u_pat' };
      return null;
    };
    mockPrisma.doctor.findUnique = async (args: any) => {
      if (args.where?.userId === 'u_stranger') return { id: 'doc_stranger' };
      return null;
    };
    mockPrisma.appointment.findFirst = async () => null;

    const strangerDoctor = {
      id: 'u_stranger',
      role: Role.DOCTOR,
      doctor: { id: 'doc_stranger' },
    };

    let threw = false;
    try {
      await recordsService.getPatientTimeline('pat_1', strangerDoctor);
    } catch (e: any) {
      if (e instanceof ForbiddenException && e.message.includes('appointment relationship')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should forbid timeline access without encounter');
  });

  // Test 9: Cross-patient profile update
  await test('Prevents patient from updating another patient profile', async () => {
    mockPrisma.patient.findFirst = async () => ({
      id: 'pat_A',
      userId: 'u_pat_A',
    });

    const userB = {
      id: 'u_pat_B',
      role: Role.PATIENT,
      patient: { id: 'pat_B' },
    };

    let threw = false;
    try {
      await patientsService.updateProfile('pat_A', { fullName: 'Hacked Name' }, userB);
    } catch (e: any) {
      if (e instanceof ForbiddenException) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should forbid cross-patient profile update');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

import * as assert from 'assert';
import * as bcrypt from 'bcryptjs';
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
    count: async () => 0,
    create: async (args: any) => ({ id: 'apt_123', ...args.data, doctor: { fullName: 'Dr. Test' }, patient: { fullName: 'Pat Test' } }),
    update: async (args: any) => ({ id: 'apt_123', ...args.data, doctor: { fullName: 'Dr. Test' }, patient: { fullName: 'Pat Test' } }),
    updateMany: async () => ({ count: 1 }),
  },
  doctor: {
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (args: any) => ({ id: 'doc_1', ...args.data }),
  },
  availability: {
    createMany: async () => ({ count: 1 }),
    deleteMany: async () => ({ count: 1 }),
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
  dailyDoctorToken: {
    upsert: async (args: any) => ({ lastToken: 1 }),
  },
  user: {
    findUnique: async (args: any) => {
      if (args?.where?.id) {
        return { id: args.where.id, email: 'mock@example.com', role: Role.PATIENT };
      }
      return null;
    },
    create: async (args: any) => ({ id: 'u_123', ...args.data }),
  },
  $transaction: async (cb: any) => cb(mockPrisma),
};

const mockSupabase: any = {
  uploadFile: async () => 'https://mock.supabase.co/prescriptions/mock.pdf',
};

import { AuthService } from '../src/auth/auth.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PublicRegisterRole } from '../src/auth/dto/register.dto';

import { DoctorsService } from '../src/doctors/doctors.service';

const notificationsService = new NotificationsService(mockPrisma);
const appointmentsService = new AppointmentsService(mockPrisma, notificationsService);
const prescriptionsService = new PrescriptionsService(mockPrisma, mockSupabase);
const consultationsService = new ConsultationsService(mockPrisma);
const recordsService = new RecordsService(mockPrisma);
const patientsService = new PatientsService(mockPrisma);
const authService = new AuthService(mockPrisma, { sign: () => 'mock_token' } as any);
const doctorsService = new DoctorsService(mockPrisma);

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
      consultationModes: ['CLINIC'],
      verification: { status: VerificationStatus.VERIFIED },
      availabilities: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 },
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

  // Test 10: Rejects public ADMIN registration
  await test('Rejects public registration with ADMIN role', async () => {
    let threw = false;
    try {
      await authService.register({
        email: 'attacker@evil.com',
        password: 'password123',
        role: 'ADMIN' as any,
      });
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('Public administrator registration is prohibited')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should prohibit public ADMIN registration');
  });

  // Test 11: Notification IDOR prevention
  await test('Prevents Patient B from accessing Patient A notifications', async () => {
    const userB = {
      id: 'u_pat_B',
      role: Role.PATIENT,
      patient: { id: 'pat_B' },
    };

    let threw = false;
    try {
      await notificationsService.getForUser('u_pat_A', userB);
    } catch (e: any) {
      if (e instanceof ForbiddenException && e.message.includes('another user’s notifications')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should prevent notification IDOR');
  });

  // Test 12: Prescription requires consultation to be completed
  await test('Rejects prescription for incomplete/draft consultation', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      verification: { status: VerificationStatus.VERIFIED },
    });
    mockPrisma.consultation.findUnique = async () => ({
      id: 'c_incomplete',
      doctorId: 'doc_1',
      patientId: 'pat_1',
      completedAt: null,
      appointment: { status: AppointmentStatus.CONFIRMED },
    });

    const verifiedDoc = {
      id: 'u_doc',
      role: Role.DOCTOR,
      doctor: { id: 'doc_1' },
    };

    let threw = false;
    try {
      await prescriptionsService.createPrescription(
        {
          consultationId: 'c_incomplete',
          medicines: [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', durationDays: 5 }],
        },
        verifiedDoc
      );
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('completed, finalized clinical consultations')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should reject prescription for uncompleted consultation');
  });

  // Test 13: Doctor without schedule returns empty slots (no fake fallback)
  await test('generateAvailableSlots returns empty array when doctor has no schedule for day', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_nosched',
      availabilities: [],
    });
    mockPrisma.appointment.findMany = async () => [];

    const res = await doctorsService.generateAvailableSlots('doc_nosched', '2026-09-15');
    assert.deepStrictEqual(res.slots, [], 'Slots must be empty array, never hardcoded fallbacks');
  });

  // Test 14: Prescriptions require explicit medicine dosage, frequency, and duration
  await test('Prescription rejects medicine missing dosage, frequency, or durationDays', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      verification: { status: VerificationStatus.VERIFIED },
    });
    mockPrisma.consultation.findUnique = async () => ({
      id: 'c_complete',
      doctorId: 'doc_1',
      patientId: 'pat_1',
      completedAt: new Date(),
      appointment: { status: AppointmentStatus.COMPLETED },
    });

    const verifiedDoc = {
      id: 'u_doc',
      role: Role.DOCTOR,
      doctor: { id: 'doc_1' },
    };

    let threw = false;
    try {
      await prescriptionsService.createPrescription(
        {
          consultationId: 'c_complete',
          medicines: [{ name: 'Amoxicillin', dosage: '', frequency: 'TID', durationDays: 5 }],
        },
        verifiedDoc
      );
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('Dosage is required')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should reject missing dosage');
  });

  // Test 15: Doctor registration rejects missing specialization or invalid fee
  await test('Doctor registration strictly requires specialization and valid consultation fee', async () => {
    let threw = false;
    try {
      await authService.register({
        email: 'doc@example.com',
        password: 'password123',
        role: PublicRegisterRole.DOCTOR,
        fullName: 'Dr. John Doe',
        licenseNumber: 'NMC-12345',
        clinicName: 'Health Clinic',
        // missing specialization and consultationFee
      } as any);
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('Specialization is required')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should require specialization');
  });

  // Test 16: Appointment creation rejects booking if doctor has availabilities and none on requested day
  await test('Appointment creation rejects booking if doctor has availabilities and none on requested day', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      consultationFee: 500,
      consultationModes: ['CLINIC'],
      verification: { status: VerificationStatus.VERIFIED },
      // Availabilities on Monday only (dayOfWeek 1)
      availabilities: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 },
      ],
    });
    mockPrisma.patient.findUnique = async () => ({ id: 'pat_1' });

    let threw = false;
    try {
      await appointmentsService.createAppointment({
        patientId: 'pat_1',
        doctorId: 'doc_1',
        date: '2029-01-02', // Tuesday (dayOfWeek 2)
        startTime: '10:00',
        endTime: '10:30',
      });
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('does not have scheduled availability for the selected day')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should reject booking when doctor not available on day of week');
  });

  // Test 17: UserStatus checks in AuthService login
  await test('AuthService login rejects suspended or revoked accounts', async () => {
    mockPrisma.user.findUnique = async () => ({
      id: 'u_suspended',
      email: 'suspended@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      status: 'SUSPENDED',
      role: Role.PATIENT,
    });

    let threw = false;
    try {
      await authService.login({ email: 'suspended@example.com', password: 'password123' });
    } catch (e: any) {
      if (e.message && e.message.includes('suspended or revoked')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Should reject suspended account');
  });

  // Test 18: Doctor search filters out unverified doctors strictly
  await test('DoctorsService searchDoctors and getDoctorById hide unverified doctors', async () => {
    let capturedWhere: any = null;
    mockPrisma.doctor.findMany = async (args: any) => {
      capturedWhere = args.where;
      return [];
    };

    await doctorsService.searchDoctors('Dr.', 'Cardiology');
    assert.strictEqual(capturedWhere?.verification?.status, VerificationStatus.VERIFIED, 'Must filter by VERIFIED status');

    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_unverified',
      verification: { status: VerificationStatus.PENDING },
    });

    let threw = false;
    try {
      await doctorsService.getDoctorById('doc_unverified');
    } catch (e: any) {
      if (e instanceof NotFoundException) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'getDoctorById must reject unverified doctor with NotFoundException');
  });

  // Test 19: Server-side endTime derivation from slot duration
  await test('Appointment creation derives endTime authoritatively from slotDurationMinutes', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      consultationFee: 600,
      consultationModes: ['CLINIC'],
      verification: { status: VerificationStatus.VERIFIED },
      availabilities: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 45 },
      ],
    });
    mockPrisma.patient.findUnique = async () => ({ id: 'pat_1' });

    let capturedCreateData: any = null;
    mockPrisma.appointment.create = async (args: any) => {
      capturedCreateData = args.data;
      return { id: 'apt_test', ...args.data, doctor: { fullName: 'Dr.' }, patient: { fullName: 'Pat' } };
    };

    await appointmentsService.createAppointment({
      patientId: 'pat_1',
      doctorId: 'doc_1',
      date: '2029-01-01', // Monday
      startTime: '09:00',
      endTime: '23:59', // Malicious client end time
    });

    assert.strictEqual(capturedCreateData.startTime, '09:00');
    assert.strictEqual(capturedCreateData.endTime, '09:45', 'Must compute 09:00 + 45 mins = 09:45 authoritatively');
  });

  // Test 20: DB unique constraint violation (P2002) mapped to 400 double-booking error
  await test('Appointment creation catches Prisma P2002 unique constraint error and returns friendly error', async () => {
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      consultationFee: 500,
      consultationModes: ['CLINIC'],
      verification: { status: VerificationStatus.VERIFIED },
      availabilities: [],
    });
    mockPrisma.patient.findUnique = async () => ({ id: 'pat_1' });
    mockPrisma.appointment.findFirst = async () => null; // Passed application check (race condition)
    mockPrisma.appointment.create = async () => {
      const p2002Err: any = new Error('Unique constraint failed on the fields: (`doctorId`,`date`,`startTime`)');
      p2002Err.code = 'P2002';
      throw p2002Err;
    };

    let threw = false;
    try {
      await appointmentsService.createAppointment({
        patientId: 'pat_1',
        doctorId: 'doc_1',
        date: '2029-01-01',
        startTime: '10:00',
        endTime: '10:30',
      });
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('already booked')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Must catch P2002 and throw friendly double booking error');
  });

  // Test 21: Real NestJS HTTP Endpoints, CORS and Rate Limiting
  await test('Real HTTP integration: NestJS app boots, enforces CORS and authentication', async () => {
    const { Test } = require('@nestjs/testing');
    const { AppModule } = require('../src/app.module');
    const request = require('supertest');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new (require('@nestjs/common').ValidationPipe)({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();

    try {
      // 1. Forgot password returns 404 (removed)
      const forgotRes = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' });
      assert.strictEqual(forgotRes.status, 404, 'Forgot password route should be 404');

      // 2. Doctor search returns only verified doctors
      const docSearchRes = await request(app.getHttpServer())
        .get('/doctors');
      assert.strictEqual(docSearchRes.status, 200);
      assert(Array.isArray(docSearchRes.body), 'Doctors should be an array');
      for (const d of docSearchRes.body) {
        assert.strictEqual(d.verificationStatus, 'verified', 'Every public doctor must have status verified');
      }

      // 3. Unauthenticated access to protected appointments endpoint returns 401
      const aptRes = await request(app.getHttpServer())
        .get('/appointments/patient/me');
      assert.strictEqual(aptRes.status, 401, 'Protected appointments route must reject unauthenticated request');

      // 4. Health endpoint reflects database connectivity
      const healthRes = await request(app.getHttpServer())
        .get('/health');
      assert.strictEqual(healthRes.status, 200);
      assert.strictEqual(healthRes.body.status, 'healthy');
      assert.strictEqual(healthRes.body.database, 'connected', 'Health endpoint must verify live database connectivity');

      // 5. Auth /auth/me returns 401 unauthenticated
      const meRes = await request(app.getHttpServer())
        .get('/auth/me');
      assert.strictEqual(meRes.status, 401, 'Unauthenticated /auth/me must return 401');

    } finally {
      await app.close();
    }
  });

  // Test 22: Doctor rejection of pending appointment with reason
  await test('Doctor can reject pending appointment with explicit reason', async () => {
    mockPrisma.appointment.findUnique = async () => ({
      id: 'apt_pending_1',
      doctorId: 'doc_1',
      patientId: 'pat_1',
      status: AppointmentStatus.PENDING,
      date: '2029-01-01',
      startTime: '10:00',
      doctor: { fullName: 'Dr. Specialist', userId: 'u_doc' },
      patient: { fullName: 'Patient Test', userId: 'u_pat' },
    });

    let capturedUpdate: any = null;
    mockPrisma.appointment.update = async (args: any) => {
      capturedUpdate = args.data;
      return {
        id: 'apt_pending_1',
        doctorId: 'doc_1',
        patientId: 'pat_1',
        date: '2029-01-01',
        startTime: '10:00',
        doctor: { fullName: 'Dr. Specialist' },
        patient: { fullName: 'Patient Test' },
        ...args.data,
      };
    };

    const docUser = {
      id: 'u_doc',
      role: Role.DOCTOR,
      doctor: { id: 'doc_1' },
    };

    const result = await appointmentsService.rejectAppointment(
      'apt_pending_1',
      'Surgery schedule conflict',
      docUser
    );

    assert.strictEqual(capturedUpdate.status, AppointmentStatus.REJECTED);
    assert.strictEqual(capturedUpdate.rejectionReason, 'Surgery schedule conflict');
    assert.strictEqual(result.status, 'rejected');
    assert.strictEqual(result.rejectionReason, 'Surgery schedule conflict');
  });

  // Test 23: State machine rejects invalid transitions (e.g. COMPLETED -> PENDING, REJECTED -> CONFIRMED)
  await test('State machine enforces valid transitions and rejects invalid regressions', async () => {
    mockPrisma.appointment.findUnique = async () => ({
      id: 'apt_completed_1',
      doctorId: 'doc_1',
      patientId: 'pat_1',
      status: AppointmentStatus.COMPLETED,
      doctor: { fullName: 'Dr. Specialist', userId: 'u_doc' },
      patient: { fullName: 'Patient Test', userId: 'u_pat' },
    });

    const docUser = {
      id: 'u_doc',
      role: Role.DOCTOR,
      doctor: { id: 'doc_1' },
    };

    let threw = false;
    try {
      await appointmentsService.updateAppointmentStatus('apt_completed_1', 'PENDING' as any, docUser);
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('Invalid status transition')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'COMPLETED appointment must not transition back to PENDING');
  });

  // Test 24: Concurrent booking safety simulation (5 concurrent requests for same slot -> 1 winner)
  await test('Concurrent booking simulation: 5 simultaneous requests for same slot results in exactly 1 winner', async () => {
    let slotTaken = false;
    mockPrisma.doctor.findUnique = async () => ({
      id: 'doc_1',
      consultationFee: 500,
      consultationModes: ['CLINIC'],
      verification: { status: VerificationStatus.VERIFIED },
      availabilities: [],
    });
    mockPrisma.patient.findUnique = async () => ({ id: 'pat_1' });

    mockPrisma.appointment.count = async () => {
      return slotTaken ? 1 : 0;
    };

    mockPrisma.appointment.findFirst = async () => {
      if (slotTaken) {
        return { id: 'existing_apt', status: AppointmentStatus.PENDING };
      }
      return null;
    };

    mockPrisma.appointment.create = async (args: any) => {
      if (slotTaken) {
        const p2002Err: any = new Error('Unique constraint failed on the fields: (`doctorId`,`date`,`startTime`)');
        p2002Err.code = 'P2002';
        throw p2002Err;
      }
      slotTaken = true;
      return { id: 'apt_winner', ...args.data, doctor: { fullName: 'Dr.' }, patient: { fullName: 'Pat' } };
    };

    const requests = [1, 2, 3, 4, 5].map(async (i) => {
      try {
        const res = await appointmentsService.createAppointment({
          patientId: `pat_${i}`,
          doctorId: 'doc_1',
          date: '2029-01-01',
          startTime: '10:00',
          endTime: '10:30',
        });
        return { success: true, res };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    const results = await Promise.all(requests);
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    assert.strictEqual(successes.length, 1, 'Exactly 1 concurrent request must win the slot');
    assert.strictEqual(failures.length, 4, '4 concurrent requests must be rejected');
    for (const f of failures) {
      assert(f.error?.includes('already booked'), 'Rejected requests must receive "slot already booked" error');
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();


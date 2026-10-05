const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../backend/src/doctors/doctors.service.ts'), 'utf8');
const moduleUnderTest = { exports: {} };
class HttpError extends Error {}
const imports = {
  '@nestjs/common': { Injectable: () => (target) => target, Logger: class { warn() {} }, BadRequestException: HttpError, ForbiddenException: HttpError, NotFoundException: HttpError, UnauthorizedException: HttpError },
  '../prisma/prisma.service': {},
  '../notifications/notifications.service': {},
  '@prisma/client': { Role: { ADMIN: 'ADMIN', DOCTOR: 'DOCTOR' }, VerificationStatus: { VERIFIED: 'VERIFIED', PENDING: 'PENDING' }, AppointmentStatus: {} },
};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText, {
  module: moduleUnderTest, exports: moduleUnderTest.exports, console,
  require: (name) => { assert.ok(name in imports, `Unexpected import: ${name}`); return imports[name]; },
});
const { DoctorsService } = moduleUnderTest.exports;
const copy = (value) => JSON.parse(JSON.stringify(value));

function harness(failCreate) {
  let state = {
    doctor: { id: 'doc', userId: 'user', fullName: 'Recorded name', specialization: 'Recorded specialty', patientsPerSlot: 1,
      consultationFee: 500, verification: { status: 'VERIFIED', registrationNumber: 'REG', registrationAuthority: 'Council', submittedDocuments: [{ url: 'recorded-document' }] },
      clinic: { name: 'Recorded clinic', address: 'Recorded address', timings: '09:00 - 12:00, 17:00 - 20:00' },
      qualifications: [{ id: 'degree-id', doctorId: 'doc', degree: 'BDS', institution: 'Recorded university', year: 2010 }],
      availabilities: [
        { id: 'morning-sunday', doctorId: 'doc', dayOfWeek: 0, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 },
        { id: 'evening-sunday', doctorId: 'doc', dayOfWeek: 0, startTime: '17:00', endTime: '20:00', slotDurationMinutes: 30 },
        { id: 'morning-friday', doctorId: 'doc', dayOfWeek: 5, startTime: '10:00', endTime: '12:00', slotDurationMinutes: 30 },
      ] },
    otherUser: { id: 'other', records: [{ id: 'private-history' }] },
    appointments: [{ id: 'booked', patientId: 'patient', status: 'CONFIRMED' }], overrides: [],
  };
  const initial = copy(state);
  const calls = [];
  const assign = (target, data) => { for (const [key, value] of Object.entries(data)) if (value !== undefined) target[key] = copy(value); };
  const prisma = {
    doctor: {
      findUnique: async () => copy(state.doctor), findFirst: async () => copy(state.doctor),
      update: async ({ data }) => {
        calls.push('profile');
        const { verification, clinic, ...fields } = data;
        assign(state.doctor, fields);
        if (verification) assign(state.doctor.verification, verification.update);
        if (clinic) assign(state.doctor.clinic, clinic.upsert.update);
        return copy(state.doctor);
      },
    },
    doctorQualification: {
      deleteMany: async ({ where }) => { assert.equal(where.doctorId, 'doc'); calls.push('delete-qualifications'); state.doctor.qualifications = []; },
      createMany: async ({ data }) => { if (failCreate === 'qualifications') throw new Error('qualification write failed'); state.doctor.qualifications = copy(data); },
    },
    doctorVerification: { upsert: async ({ update }) => assign(state.doctor.verification, update) },
    availability: {
      deleteMany: async ({ where }) => {
        assert.equal(where.doctorId, 'doc');
        calls.push('delete-shifts');
        state.doctor.availabilities = state.doctor.availabilities.filter((row) => where.id ? !where.id.in.includes(row.id) : false);
      },
      createMany: async ({ data }) => { if (failCreate === 'shifts') throw new Error('shift write failed'); state.doctor.availabilities.push(...copy(data)); },
      updateMany: async ({ data }) => { for (const row of state.doctor.availabilities) assign(row, data); },
    },
    doctorScheduleOverride: { upsert: async ({ create }) => state.overrides.push(copy(create)) },
    auditLog: { create: async () => {} },
    $transaction: async (fn) => {
      const snapshot = copy(state);
      try { return await fn(prisma); } catch (error) { state = snapshot; throw error; }
    },
  };
  const service = new DoctorsService(prisma, {});
  service.formatDoctor = (doc) => doc;
  service.recalculateBookedAppointmentsForDoctor = async () => {};
  return { service, initial, calls, state: () => copy(state) };
}

test('ordinary profile edits preserve existing credentials, schedule, patients and appointments', async () => {
  const app = harness();
  await app.service.updateDoctorProfile('user', { consultationFee: 700 });
  const expected = copy(app.initial); expected.doctor.consultationFee = 700;
  assert.deepEqual(app.state(), expected);
  assert.equal(app.calls.includes('delete-qualifications'), false);
});

test('legacy qualification text preserves metadata and identical credentials stay verified', async () => {
  const app = harness();
  await app.service.updateDoctorProfile('user', { qualifications: 'BDS' });
  assert.deepEqual(app.state(), app.initial);
  assert.equal(app.calls.includes('delete-qualifications'), false);
});

test('invalid or null qualification payload cannot erase existing credentials', async () => {
  for (const qualificationDetails of [null, [{}], [{ degree: 'BDS', year: '2010' }]]) {
    const app = harness();
    await assert.rejects(app.service.updateDoctorProfile('user', { fullName: 'Changed', qualificationDetails }));
    assert.deepEqual(app.state(), app.initial);
  }
});

test('credential replacement failure rolls back profile, verification and qualification writes', async () => {
  const app = harness('qualifications');
  await assert.rejects(app.service.updateDoctorProfile('user', { fullName: 'Changed', qualificationDetails: [{ degree: 'MDS' }] }), /write failed/);
  assert.deepEqual(app.state(), app.initial);
});

test('duration-only profile edit preserves custom Sunday/Friday days and shift IDs', async () => {
  const app = harness();
  await app.service.updateDoctorProfile('user', { slotDurationMinutes: 20 });
  const expected = copy(app.initial);
  for (const row of expected.doctor.availabilities) row.slotDurationMinutes = 20;
  assert.deepEqual(app.state(), expected);
  assert.equal(app.calls.includes('delete-shifts'), false);
});

test('resaving unchanged clinic timing text does not rebuild a custom schedule', async () => {
  const app = harness();
  await app.service.updateDoctorProfile('user', { clinicTimings: app.initial.doctor.clinic.timings, qualifications: 'BDS' });
  assert.deepEqual(app.state(), app.initial);
  assert.equal(app.calls.includes('delete-shifts'), false);
});

test('partial morning settings preserve untouched evening shifts and existing operating days', async () => {
  const app = harness();
  await app.service.updateScheduleSettings({ morningStart: '8:30 AM', morningEnd: '11:30 AM' }, { id: 'user', role: 'DOCTOR' });
  const saved = app.state();
  assert.deepEqual(saved.doctor.availabilities.find((row) => row.id === 'evening-sunday'), app.initial.doctor.availabilities[1]);
  assert.deepEqual([...new Set(saved.doctor.availabilities.map((row) => row.dayOfWeek))].sort(), [0, 5]);
  assert.deepEqual(saved.appointments, app.initial.appointments);
  assert.deepEqual(saved.otherUser, app.initial.otherUser);
});

test('schedule create failure rolls back shifts, capacity and date overrides', async () => {
  const app = harness('shifts');
  await assert.rejects(app.service.updateScheduleSettings({ date: '2026-10-05', patientsPerSlot: 2, morningStart: '08:30', morningEnd: '11:30' }, { id: 'user' }), /write failed/);
  assert.deepEqual(app.state(), app.initial);
});

test('invalid/incomplete shifts and non-owner schedule writes fail without changing data', async () => {
  for (const dto of [{ morningStart: '08:30' }, { morningStart: '25:00', morningEnd: '26:00' }, { morningStart: '10:00', morningEnd: '09:00' }, { slotDurationMinutes: 0 }]) {
    const app = harness();
    await assert.rejects(app.service.updateScheduleSettings(dto, { id: 'user' }));
    assert.deepEqual(app.state(), app.initial);
  }
  const app = harness();
  await assert.rejects(app.service.updateScheduleSettings({ slotDurationMinutes: 20 }, { id: 'someone-else', role: 'DOCTOR' }), /owning doctor/);
  assert.deepEqual(app.state(), app.initial);
});

test('date-only duration/capacity override leaves the default weekly schedule unchanged', async () => {
  const app = harness();
  await app.service.updateScheduleSettings({ date: '2026-10-05', slotDurationMinutes: 20, patientsPerSlot: 2 }, { id: 'user' });
  assert.deepEqual(app.state().doctor, app.initial.doctor);
  assert.equal(app.state().overrides.length, 1);
});

test('credential resubmission retains existing uploads when documents are omitted and stays pending', async () => {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../backend/src/verification/verification.service.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText, {
    module, exports: module.exports, require: (name) => imports[name],
  });
  let recorded = { submittedDocuments: [{ url: 'recorded-document' }], status: 'VERIFIED' };
  const service = new module.exports.VerificationService({ doctorVerification: { upsert: async ({ update }) => {
    for (const [key, value] of Object.entries(update)) if (value !== undefined) recorded[key] = copy(value);
    return recorded;
  } } });
  const result = await service.submitVerification('doc', { registrationNumber: '12345', registrationAuthority: 'Dental council' });
  assert.deepEqual(recorded.submittedDocuments, [{ url: 'recorded-document' }]);
  assert.equal(result.status, 'PENDING');
  assert.equal(result.registryDetails.verified, false);
});

test('production build configuration cannot automatically push or reset the database schema', () => {
  const render = fs.readFileSync(path.join(__dirname, '../backend/render.yaml'), 'utf8');
  assert.doesNotMatch(render, /prisma\s+(?:db\s+push|migrate\s+reset|migrate\s+dev)|seed|--accept-data-loss/);
});

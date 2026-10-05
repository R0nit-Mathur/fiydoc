import type { Prescription } from '@/types/index';

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function strings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result = value.map(text).filter((item): item is string => Boolean(item));
  return result.length ? result : undefined;
}

function dateLabel(value: unknown): string {
  const source = text(value);
  if (!source || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(source)) return '';
  const day = new Date(`${source.slice(0, 10)}T00:00:00Z`);
  const date = new Date(source);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== source.slice(0, 10)
    || !Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Map recorded fields only. Issue/creation timestamps are not evidence of a signature. */
export function mapPrescription(value: unknown): Prescription {
  const rx = record(value);
  const id = text(rx.id);
  if (!id) throw new Error('Invalid prescription record.');
  const doctor = record(rx.doctor);
  const clinic = record(doctor.clinic);
  const verification = record(doctor.verification);
  const patient = record(rx.patient);
  const consultation = record(rx.consultation);
  const rawTests = Array.isArray(rx.labTests) && rx.labTests.length
    ? rx.labTests : Array.isArray(rx.tests) ? rx.tests : [];
  const tests = rawTests.map((value, index) => {
    const test = record(value);
    return {
      id: text(test.id) || `${id}-test-${index}`,
      name: text(value) || text(test.name) || text(test.testName) || 'Test name not recorded',
      category: text(test.category),
      fastingRequired: typeof test.fastingRequired === 'boolean' ? test.fastingRequired : undefined,
    };
  });
  const age = patient.age ?? consultation.patientAge ?? rx.patientAge;
  const qualifications = doctor.qualifications ?? rx.doctorQualifications;
  const vitals = record(rx.vitals ?? consultation.vitals);
  const mappedVitals = Object.fromEntries(
    ['bp', 'bpSystolic', 'bpDiastolic', 'pulse', 'temp', 'spo2', 'weight']
      .flatMap((key) => {
        const value = vitals[key];
        const label = text(value) ?? (typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined);
        return label === undefined ? [] : [[key, label]];
      })
  );

  return {
    id,
    consultationId: text(rx.consultationId) || '',
    patientId: text(rx.patientId) || text(patient.id) || '',
    doctorId: text(rx.doctorId) || text(doctor.id) || '',
    doctorName: text(doctor.fullName) || text(rx.doctorName),
    doctorSpecialty: text(doctor.specialization) || text(rx.doctorSpecialty),
    doctorAvatar: text(doctor.profilePhoto) || text(doctor.avatar) || text(record(doctor.user).profilePhoto) || text(rx.doctorAvatar),
    doctorQualifications: strings(qualifications) || text(qualifications),
    doctorMciNumber: text(verification.registrationNumber) || text(doctor.registrationNumber) || text(rx.doctorMciNumber),
    clinicName: text(clinic.name) || text(rx.clinicName),
    clinicAddress: text(clinic.address) || text(rx.clinicAddress),
    patientName: text(patient.fullName) || text(rx.patientName),
    patientAge: typeof age === 'number' && Number.isFinite(age) && age >= 0 ? age : undefined,
    patientGender: text(patient.gender) || text(consultation.patientGender) || text(rx.patientGender),
    chiefComplaint: text(rx.chiefComplaint) || text(consultation.chiefComplaint),
    symptoms: strings(rx.symptoms) || strings(consultation.symptoms),
    observations: text(rx.observations) || text(consultation.observations),
    emergencyWarning: text(rx.emergencyWarning) || text(consultation.emergencyWarning),
    diagnosis: text(rx.diagnosis),
    doctorNotes: text(rx.doctorNotes),
    followUpInstructions: text(rx.followUpInstructions),
    verificationCode: text(rx.verificationCode) || '',
    pdfUrl: text(rx.pdfUrl),
    createdAt: dateLabel(rx.createdAt),
    tests: tests.length ? tests : undefined,
    lifestyleInstructions: strings(rx.lifestyleInstructions),
    vitals: Object.keys(mappedVitals).length ? mappedVitals : undefined,
    medicines: (Array.isArray(rx.medicines) ? rx.medicines : []).map((value, index) => {
      const medicine = record(value);
      const duration = medicine.durationDays;
      return {
        id: text(medicine.id) || `${id}-medicine-${index}`,
        name: text(medicine.name) || 'Medicine name not recorded',
        dosage: text(medicine.dosage) || '',
        frequency: text(medicine.frequency) || '',
        durationDays: typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : undefined,
        instructions: text(medicine.instructions),
      };
    }),
  };
}

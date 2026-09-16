# FiYDoc End-to-End Test Matrix

This matrix documents verification across the 8 critical end-to-end flows (Flows A through H).

---

### Flow A: New Patient Registration & Onboarding
- **Steps**:
  1. Patient signs up at `POST /auth/register` with role `PATIENT`.
  2. Server normalizes email and phone, securely hashes password, creates user and empty patient profile.
  3. Patient updates profile with allergies, chronic conditions, and emergency contact at `PATCH /patients/me`.
  4. Profile re-fetched via `GET /patients/me`.
- **Expected Result**: Profile is persisted in database and returned authoritatively.
- **Automated Verification**: Verified in `test/verify-security.ts`.
- **Status**: `PASSED`

---

### Flow B: Doctor Onboarding, Verification & Availability Setup
- **Steps**:
  1. Doctor registers with specialization, consultation fee, and license number.
  2. Doctor defines weekly working availability (e.g. Mon-Sat 10:30-13:30 and 17:00-20:00, 15m slots) via `PATCH /doctors/me/availability`.
  3. Doctor verified by admin.
  4. Unverified doctors hidden from search; verified doctor appears in `GET /doctors`.
- **Expected Result**: Schedule is saved in database and generates slots for booking.
- **Automated Verification**: Verified in `test/verify-security.ts`.
- **Status**: `PASSED`

---

### Flow C: Doctor Discovery, Slot Generation & Conflict-Free Booking
- **Steps**:
  1. Patient searches for doctor by specialty or name via `GET /doctors?q=...`.
  2. Patient navigates to slot selector; client calls `GET /doctors/:id/slots?date=YYYY-MM-DD`.
  3. Server dynamically generates available slots based on doctor availability windows, filtering out booked slots.
  4. Patient confirms booking at `POST /appointments`.
  5. Server validates slot is in future, within working hours, derives endTime, and creates appointment.
- **Expected Result**: Appointment created with status `PENDING` or `CONFIRMED`.
- **Automated Verification**: Verified in `test/verify-security.ts`.
- **Status**: `PASSED`

---

### Flow D: Concurrency & Double-Booking Protection
- **Steps**:
  1. Two or more concurrent requests attempt to book the exact same `(doctorId, date, startTime)` tuple simultaneously.
  2. PostgreSQL unique constraint `@@unique([doctorId, date, startTime])` enforces atomicity.
  3. First request succeeds with `201 Created`.
  4. Subsequent requests fail with friendly `400 Bad Request` ("This time slot has just been booked by another patient.").
  5. Client displays error alert without creating fake local appointment.
- **Expected Result**: Exactly 1 winner, 0 double-bookings.
- **Automated Verification**: Verified with 5 simultaneous requests in `test/verify-security.ts`.
- **Status**: `PASSED`

---

### Flow E: Doctor Approval & Rejection Flow
- **Steps**:
  1. Patient books appointment; appointment sits in `PENDING` state in doctor's queue.
  2. Doctor reviews appointment in `/(doctor)/(tabs)/appointments`.
  3. Doctor can approve (`POST /appointments/:id/approve`) -> moves to `CONFIRMED`.
  4. Doctor can reject with reason (`POST /appointments/:id/reject`) -> moves to `REJECTED` and notifies patient.
- **Expected Result**: Valid state transitions enforced; illegal transitions rejected.
- **Automated Verification**: Verified in `test/verify-security.ts`.
- **Status**: `PASSED`

---

### Flow F: Emergency Schedule Delay & Leave Overrides
- **Steps**:
  1. Doctor applies emergency +15m delay via `POST /doctors/schedule/delay`.
  2. Appointments for the day reflect delay; slots shift accordingly.
  3. Doctor marks day on leave via `POST /doctors/schedule/leave`.
  4. Existing appointments auto-cancelled; prospective slots return empty `[]`.
  5. Doctor can revert overrides via `POST /doctors/schedule/undo`.
- **Expected Result**: Patient notifications triggered and slot generation accurately mirrors doctor status.
- **Automated Verification**: Verified in `test/verify-security.ts`.
- **Status**: `PASSED`

---

### Flow G: Clinical Consultation & E-Prescription Issuance
- **Steps**:
  1. Doctor starts consultation for assigned appointment (`POST /consultations`).
  2. Doctor inputs diagnosis, notes, and prescribed medications with dosage, frequency, and duration.
  3. Doctor issues prescription via `POST /prescriptions`.
  4. Server validates doctor is verified and medicine parameters are complete.
- **Expected Result**: E-prescription is securely created and attached to patient health timeline.
- **Automated Verification**: Verified in `test/verify-security.ts`.
- **Status**: `PASSED`

---

### Flow H: Multi-Tenant Medical Record Isolation
- **Steps**:
  1. Patient B attempts to retrieve Patient A's prescriptions via `GET /prescriptions/patient/:patientAId`.
  2. Patient B attempts to cancel Patient A's appointment via `POST /appointments/:patientAAppointmentId/cancel`.
  3. Doctor C (not assigned to Patient A) attempts to access Patient A's timeline without appointment.
- **Expected Result**: Server returns `403 Forbidden` on all cross-tenant attempts.
- **Automated Verification**: Verified in `test/verify-security.ts`.
- **Status**: `PASSED`

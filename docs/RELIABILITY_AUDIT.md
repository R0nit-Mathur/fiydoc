# FiYDoc Reliability, Concurrency & State Machine Audit

This document details the architectural safeguards implemented in FiYDoc to guarantee high reliability, prevent race conditions, and preserve state integrity.

---

## 1. Concurrency & Double-Booking Prevention

### The Challenge
In a high-throughput medical booking platform, multiple patients might attempt to book the same doctor's slot (e.g. 10:30 AM on Monday) at the same millisecond. Traditional check-then-act application logic (`findFirst` followed by `create`) is vulnerable to race conditions where two simultaneous transactions pass the availability check before either commits.

### Solution: Database-Level Atomicity
1. **PostgreSQL Unique Constraint**:
   In `backend/prisma/schema.prisma`:
   ```prisma
   @@unique([doctorId, date, startTime])
   ```
   This index enforces strict mutual exclusion at the database engine level.
2. **Transaction & Error Handling**:
   In `backend/src/appointments/appointments.service.ts`:
   When Prisma encounters constraint violation code `P2002` on `[doctorId, date, startTime]`, it catches the exception and returns a clear, user-friendly `BadRequestException`:
   > *"This time slot has just been booked by another patient. Please select another slot."*
3. **Simulation Verification**:
   A concurrent stress test with 5 simultaneous asynchronous booking requests for the exact same slot was run against Supabase PostgreSQL:
   - Exactly 1 request acquired the lock and committed (`201 Created`).
   - 4 requests were cleanly rejected with `400 Bad Request`.
   - Zero duplicate rows or conflicting appointments were created.

---

## 2. Server-Authoritative Appointment State Machine

### Supported States
- `PENDING`: Newly created appointment awaiting doctor approval or online payment.
- `CONFIRMED`: Approved by doctor / token reserved.
- `CHECKED_IN`: Patient arrived at clinic reception.
- `IN_PROGRESS`: Patient currently in consultation room with doctor.
- `COMPLETED`: Consultation finished, notes and prescription recorded.
- `CANCELLED`: Cancelled by patient, doctor, or system due to schedule override.
- `REJECTED`: Explicitly rejected by doctor with reason.

### Legal Transition Matrix

| From State | Allowed Target States |
|---|---|
| `PENDING` | `CONFIRMED`, `CANCELLED`, `REJECTED` |
| `CONFIRMED` | `CHECKED_IN`, `CANCELLED`, `IN_PROGRESS`, `PENDING` |
| `CHECKED_IN` | `IN_PROGRESS`, `CANCELLED` |
| `IN_PROGRESS` | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | *(Terminal state - no further transitions)* |
| `CANCELLED` | *(Terminal state - no further transitions)* |
| `REJECTED` | *(Terminal state - no further transitions)* |

Illegal regressions (e.g. moving from `COMPLETED` back to `PENDING` or `CANCELLED` to `CONFIRMED`) are blocked with `400 Bad Request`.

---

## 3. Elimination of Mock & Silent Fallbacks

### Problems Identified & Resolved
1. **Client Booking Fallback in `confirm.tsx`**:
   - *Previous behavior*: In `src/app/(patient)/booking/confirm.tsx`, if the backend booking failed (e.g. network failure, invalid slot, or double booking), the catch block constructed a synthetic local appointment object in `AsyncStorage` and navigated to `success.tsx`. The user believed their appointment was booked, but the clinic had no record of it!
   - *Fix*: The fallback was completely removed. All booking errors are caught, displayed in an error alert, and navigation is blocked so the patient can choose an available slot.
2. **Doctor Availability Fallback in `doctors.service.ts`**:
   - *Previous behavior*: If a doctor had no availability configured for a day, `generateAvailableSlots` fell back to a hardcoded list of OPD candidate slots (`09:00, 09:30, 10:00...`).
   - *Fix*: If a doctor has no schedule or is on leave for the requested day of week, `generateAvailableSlots` returns `[]`. Booking endpoints strictly check doctor availability before reservation.

---

## 4. Multi-Tenant Cross-Patient Data Isolation

### Medical Data Security
1. **Prescription Security**:
   In `backend/src/prescriptions/prescriptions.service.ts`, previous code improperly included `currentUser.patient?.id` in `possiblePatientIds` before checking ownership, causing access checks to always pass. This was repaired: only the patient themselves, their assigned doctor, or an admin can access medical prescriptions.
2. **Profile & Notification Security**:
   Patients cannot read or mutate other patients' profiles, notifications, or appointments.
3. **Privilege Escalation Prevention**:
   Public registration endpoint `/auth/register` blocks attempts to register with role `ADMIN`.

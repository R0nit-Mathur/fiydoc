# FiYDoc Frontend-to-Backend API Contract Audit

This document audits every frontend screen and service against the backend endpoints to guarantee zero silent mock fallbacks, accurate contract shapes, and correct persistence.

---

## 1. Authentication Flows
- **Screens**: `(auth)/login.tsx`, `(auth)/signup.tsx`, `(auth)/verify-otp.tsx`
- **Service Call**: `authService.login()`, `authService.register()`
- **Backend Route**: `POST /auth/login`, `POST /auth/register`
- **Contract Alignment**:
  - Request sends email/phone and password.
  - Response parses `access_token` and authoritative `user` payload into Zustand `useAuthStore`.
  - Stored token automatically injected into `Authorization: Bearer <token>` headers by `src/services/apiClient.ts`.
- **Status**: `VERIFIED & SYNCED`

---

## 2. Doctor Discovery & Profiles
- **Screens**: `(patient)/(tabs)/home.tsx`, `(patient)/(tabs)/discovery.tsx`, `(patient)/doctor/[id].tsx`
- **Service Calls**: `doctorService.getDoctors()`, `doctorService.getDoctorById()`
- **Backend Route**: `GET /doctors`, `GET /doctors/:id`
- **Contract Alignment**:
  - Real database doctors queried from Supabase PostgreSQL.
  - Excludes unverified doctors.
  - Supports query search, specialty filtering, and coordinates.
- **Status**: `VERIFIED & SYNCED`

---

## 3. Slot Selection & Booking Flow
- **Screens**: `(patient)/booking/slot-select.tsx`, `(patient)/booking/confirm.tsx`, `(patient)/booking/success.tsx`
- **Service Calls**: `doctorService.getAvailableSlotsDetailed()`, `appointmentService.bookAppointment()`
- **Backend Route**: `GET /doctors/:id/slots?date=YYYY-MM-DD`, `POST /appointments`
- **Contract Alignment**:
  - Server generates slots dynamically from doctor availability windows.
  - Returns `[]` when no schedule exists for that day (no synthetic dummy slots).
  - In `confirm.tsx`: Removed fake local appointment generation in `catch` blocks. If the server fails or rejects the appointment (e.g. double booking or slot taken), an alert modal displays the real server error message and halts navigation.
- **Status**: `VERIFIED & SYNCED`

---

## 4. Patient Appointments & History
- **Screens**: `(patient)/(tabs)/appointments.tsx`, `(patient)/appointments/[id].tsx`
- **Service Calls**: `appointmentService.getPatientAppointments()`, `appointmentService.getAppointmentById()`
- **Backend Route**: `GET /appointments/patient/:patientId`, `GET /appointments/:id`
- **Contract Alignment**:
  - Fetches server-authoritative appointments list.
  - Detail screen fetches from server first, updating store with fresh status.
- **Status**: `VERIFIED & SYNCED`

---

## 5. Doctor Schedule & OPD Queue Management
- **Screens**: `(doctor)/(tabs)/schedule.tsx`, `(doctor)/(tabs)/appointments.tsx`
- **Service Calls**:
  - `doctorService.applyScheduleDelay()` (`POST /doctors/schedule/delay`)
  - `doctorService.applyScheduleLeave()` (`POST /doctors/schedule/leave`)
  - `doctorService.undoScheduleOverride()` (`POST /doctors/schedule/undo`)
  - `doctorService.updateMyAvailability()` (`PATCH /doctors/me/availability`)
  - `appointmentService.approveAppointment()` (`POST /appointments/:id/approve`)
  - `appointmentService.rejectAppointment()` (`POST /appointments/:id/reject`)
  - `appointmentService.updateAppointmentStatus()` (`POST /appointments/:id/status`)
- **Contract Alignment**:
  - Doctor appointments screen includes both "Approve" and "Reject" buttons for pending requests.
  - Tapping "Reject" submits reason to backend and transitions status to `REJECTED`.
  - Shift timings and slot duration modified in schedule settings persist directly to database via `PATCH /doctors/me/availability`.
- **Status**: `VERIFIED & SYNCED`

---

## 6. Consultations & E-Prescriptions
- **Screens**: `(doctor)/consultation/[id].tsx`, `(patient)/(tabs)/health.tsx`, `/health/prescription/[id].tsx`
- **Service Calls**: `consultationService.createConsultation()`, `prescriptionService.createPrescription()`, `prescriptionService.getPatientPrescriptions()`
- **Backend Route**: `POST /consultations`, `POST /prescriptions`, `GET /prescriptions/patient/:id`
- **Contract Alignment**:
  - Enforces mandatory medicine attributes (`dosage`, `frequency`, `durationDays`).
  - Cross-tenant access strictly prevented.
- **Status**: `VERIFIED & SYNCED`

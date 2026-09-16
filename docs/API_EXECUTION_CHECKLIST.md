# FiYDoc API Execution Checklist

| Category | Endpoint | Method | Status | Verification Detail |
|---|---|---|---|---|
| **Health** | `/` | GET | `COMPLIANT` | Verified 200 return |
| **Health** | `/health` | GET | `COMPLIANT` | Verified live `SELECT 1` query to Supabase PostgreSQL |
| **Auth** | `/auth/register` | POST | `COMPLIANT` | Hashes with bcrypt, prevents ADMIN privilege escalation, normalizes email |
| **Auth** | `/auth/login` | POST | `COMPLIANT` | Rejects deactivated/suspended users, compares bcrypt hash |
| **Auth** | `/auth/me` | GET | `COMPLIANT` | Verified authoritative payload with JwtAuthGuard |
| **Patients** | `/patients/me` | GET | `COMPLIANT` | Verified profile retrieval; declared before `:id` to prevent route collision |
| **Patients** | `/patients/me` | PATCH | `COMPLIANT` | Updates medical history, allergies, chronic conditions, phone/email |
| **Patients** | `/patients/:id` | GET | `COMPLIANT` | Verified patient ownership / doctor assignment isolation |
| **Doctors** | `/doctors` | GET | `COMPLIANT` | Supports search `q`, specialty, fee range, mode, pagination, sorting; excludes unverified |
| **Doctors** | `/doctors/me` | GET | `COMPLIANT` | Retrieves doctor profile & settings |
| **Doctors** | `/doctors/me` | PATCH | `COMPLIANT` | Updates doctor profile details & fee |
| **Doctors** | `/doctors/me/availability` | PATCH | `COMPLIANT` | Updates weekly schedule and slot durations in database |
| **Doctors** | `/doctors/:id` | GET | `COMPLIANT` | Returns public doctor details, ratings, clinic location |
| **Doctors** | `/doctors/:id/slots` | GET | `COMPLIANT` | Generates live slots; returns `[]` when no availability exists |
| **Doctors** | `/doctors/schedule/delay` | POST | `COMPLIANT` | Applies temporary OPD delay; authorized for doctor owner/admin |
| **Doctors** | `/doctors/schedule/leave` | POST | `COMPLIANT` | Marks leave, auto-cancels active appointments; authorized for doctor owner/admin |
| **Doctors** | `/doctors/schedule/undo` | POST | `COMPLIANT` | Reverts delay or leave override on server |
| **Appointments** | `/appointments` | POST | `COMPLIANT` | Validates future slot, working hours, derives endTime, handles P2002 concurrency lock |
| **Appointments** | `/appointments/:id` | GET | `COMPLIANT` | Authorized for patient/doctor/admin |
| **Appointments** | `/appointments/patient/:id` | GET | `COMPLIANT` | Authorized for patient owner |
| **Appointments** | `/appointments/doctor/:id` | GET | `COMPLIANT` | Authorized for doctor queue |
| **Appointments** | `/appointments/:id/approve` | POST | `COMPLIANT` | Doctor approves pending appointment -> CONFIRMED |
| **Appointments** | `/appointments/:id/reject` | POST | `COMPLIANT` | Doctor rejects pending appointment with reason -> REJECTED |
| **Appointments** | `/appointments/:id/cancel` | POST | `COMPLIANT` | Authorized cancellation and notifications cleanup |
| **Appointments** | `/appointments/:id/status` | POST | `COMPLIANT` | Enforces state machine transitions (CHECKED_IN, IN_PROGRESS, COMPLETED) |
| **Consultations** | `/consultations` | POST | `COMPLIANT` | Verified doctor assigned to appointment |
| **Consultations** | `/consultations/:id` | GET | `COMPLIANT` | Authorized consultation record retrieval |
| **Prescriptions** | `/prescriptions` | POST | `COMPLIANT` | Rejects unverified doctor, requires valid dosage/frequency/durationDays |
| **Prescriptions** | `/prescriptions/patient/:id`| GET | `COMPLIANT` | Isolated cross-tenant access; Patient B cannot view Patient A prescriptions |

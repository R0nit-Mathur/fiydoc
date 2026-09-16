# FiYDoc Backend API Inventory

This document provides a comprehensive, production-grade inventory of all REST endpoints exposed by the FiYDoc NestJS backend.

---

## 1. System & Health

### `GET /`
- **Description**: Basic root welcome message.
- **Authentication**: Public
- **Response**: `200 OK`
  ```json
  "Hello World!"
  ```

### `GET /health`
- **Description**: Real database connectivity health check. Executes a live `SELECT 1` query via Prisma.
- **Authentication**: Public
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-16T01:25:00.000Z",
    "uptime": 124.5,
    "database": "connected"
  }
  ```
- **Errors**:
  - `503 Service Unavailable`: If database connectivity fails.

---

## 2. Authentication (`/auth`)

### `POST /auth/register`
- **Description**: Registers a new patient or doctor account with normalized credentials (lowercase/trimmed email/phone) and securely hashes password with bcrypt. Blocks administrative escalation (`ADMIN` cannot be registered publicly).
- **Authentication**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210",
    "password": "SecurePassword123!",
    "role": "PATIENT" | "DOCTOR",
    "specialization": "Cardiology", // Required if role === DOCTOR
    "consultationFee": 800          // Required if role === DOCTOR
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "access_token": "jwt-token-string",
    "user": {
      "id": "uuid-v4",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+919876543210",
      "role": "PATIENT"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Validation failure (e.g. missing specialization/fee for doctor, admin registration attempt).
  - `409 Conflict`: Account with email or phone already exists.

### `POST /auth/login`
- **Description**: Authenticates existing user. Normalizes input and verifies bcrypt password. Rejects deactivated or suspended accounts.
- **Authentication**: Public
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK` (returns `access_token` and `user` payload with patient/doctor metadata).
- **Errors**:
  - `401 Unauthorized`: Invalid credentials or suspended account.

### `GET /auth/me`
- **Description**: Retrieves authoritative currently authenticated user session.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)
- **Response**: `200 OK`
  ```json
  {
    "id": "uuid-v4",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "PATIENT",
    "patient": { "id": "uuid-patient-id" },
    "doctor": null
  }
  ```
- **Errors**:
  - `401 Unauthorized`: Missing or invalid Bearer token.

---

## 3. Patients Module (`/patients`)

### `GET /patients/me` & `GET /patients/me/profile`
- **Description**: Returns the authenticated patient's profile, including medical history, allergies, chronic conditions, and contact details. Declared prior to `:id` to prevent route hijacking.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)
- **Response**: `200 OK`
  ```json
  {
    "id": "uuid-patient-id",
    "userId": "uuid-user-id",
    "dob": "1990-05-15T00:00:00.000Z",
    "gender": "MALE",
    "bloodGroup": "O_POSITIVE",
    "allergies": ["Penicillin"],
    "chronicConditions": ["Hypertension"],
    "user": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+919876543210"
    }
  }
  ```

### `PATCH /patients/me`
- **Description**: Updates the authenticated patient's demographics, allergies, chronic conditions, and optionally user phone/email.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)
- **Request Body**: Partial profile updates.
- **Response**: `200 OK`

### `GET /patients/:id`
- **Description**: Access specific patient profile by ID. Strictly authorized: only the patient themselves, their assigned doctor (with verified appointment), or an admin can view.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)
- **Errors**:
  - `403 Forbidden`: Cross-tenant access attempt by unauthorized third-party.

---

## 4. Doctors Module (`/doctors`)

### `GET /doctors`
- **Description**: Discovers verified doctors with fuzzy text search, specialty filtering, fee range filtering, mode filtering, pagination, and sorting. Excludes unverified/pending doctors.
- **Authentication**: Public
- **Query Parameters**:
  - `q`: Search string (matches doctor name, clinic name, or bio)
  - `specialty`: Specialty string
  - `minFee`, `maxFee`: Consultation fee bounds
  - `mode`: `CLINIC`, `VIDEO`, etc.
  - `limit`, `offset`: Pagination controls
  - `sortBy`: `rating` | `fee_asc` | `fee_desc` | `experience`
- **Response**: `200 OK` array of `Doctor` objects.

### `GET /doctors/:id`
- **Description**: Retrieves public profile, clinic details, and ratings for a single doctor.
- **Authentication**: Public
- **Response**: `200 OK`

### `GET /doctors/me`
- **Description**: Retrieves authenticated doctor profile and configuration.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

### `PATCH /doctors/me/availability`
- **Description**: Updates recurring weekly availability windows and slot duration.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard, Doctor role)
- **Request Body**:
  ```json
  {
    "availabilities": [
      { "dayOfWeek": 1, "startTime": "10:30", "endTime": "13:30", "slotDurationMinutes": 15 },
      { "dayOfWeek": 1, "startTime": "17:00", "endTime": "20:00", "slotDurationMinutes": 15 }
    ]
  }
  ```
- **Response**: `200 OK` `{ "count": 12 }`

### `GET /doctors/:id/slots?date=YYYY-MM-DD`
- **Description**: Generates real available consultation slots for the given date. Returns `[]` if doctor has no schedule or is on leave. Filters out booked slots.
- **Authentication**: Public
- **Response**: `200 OK`
  ```json
  {
    "slots": ["10:30", "10:45", "11:00"],
    "delayMinutes": 0,
    "isOnLeave": false
  }
  ```

### `POST /doctors/schedule/delay`
- **Description**: Applies temporary operational delay for OPD appointments on a date. Authorized only for the owning doctor or admin.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)
- **Request Body**: `{ "date": "2026-10-15", "delayMinutes": 20, "reason": "Emergency" }`

### `POST /doctors/schedule/leave`
- **Description**: Marks doctor on leave for a date. Auto-cancels active appointments and alerts patients. Authorized only for owning doctor or admin.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

### `POST /doctors/schedule/undo`
- **Description**: Reverts temporary delay or leave override on server.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

---

## 5. Appointments Module (`/appointments`)

### `POST /appointments`
- **Description**: Books an appointment slot. Enforces future date/time, doctor working day availability, working hour boundaries, authoritative slot duration derivation, and PostgreSQL database-level unique constraint concurrency locking `[doctorId, date, startTime]`.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)
- **Request Body**:
  ```json
  {
    "patientId": "uuid-patient-id",
    "doctorId": "uuid-doctor-id",
    "date": "2026-10-20",
    "startTime": "10:30",
    "consultationType": "CLINIC",
    "fee": 650,
    "symptoms": ["Fever", "Cough"],
    "notes": "Patient notes"
  }
  ```
- **Response**: `201 Created`
- **Errors**:
  - `400 Bad Request`: Slot outside availability or duplicate concurrent booking (Prisma P2002 handled).

### `GET /appointments/:id`
- **Description**: Fetches appointment detail. Authorized for participating patient, doctor, or admin.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

### `GET /appointments/patient/:patientId`
- **Description**: Fetches patient's appointments. Authorized for patient owner or admin.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

### `GET /appointments/doctor/:doctorId`
- **Description**: Fetches doctor's appointment queue.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

### `POST /appointments/:id/approve`
- **Description**: Doctor approves pending appointment. Transitions state to `CONFIRMED`.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

### `POST /appointments/:id/reject`
- **Description**: Doctor rejects pending appointment with reason. Transitions state to `REJECTED` and notifies patient.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)
- **Request Body**: `{ "reason": "Doctor unavailable" }`

### `POST /appointments/:id/cancel`
- **Description**: Patient or doctor cancels appointment. Validates ownership and cancels associated reminder notifications.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

### `POST /appointments/:id/status`
- **Description**: Transitions appointment lifecycle state (`CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`). Validates legal state transitions.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

---

## 6. Consultations & Prescriptions

### `POST /consultations`
- **Description**: Doctor starts or records a clinical consultation. Strictly verified against existing appointment.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard, Doctor role)

### `GET /consultations/:id`
- **Description**: Retrieves clinical notes and diagnosis. Authorized for patient, doctor, or admin.

### `POST /prescriptions`
- **Description**: Issues e-prescription linked to a consultation. Requires doctor verification and strict validation of medicines (dosage, frequency, durationDays).
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard, Verified Doctor)

### `GET /prescriptions/patient/:patientId`
- **Description**: Retrieves patient's active and historical prescriptions. Strictly cross-tenant isolated: Patient B cannot view Patient A's prescriptions.
- **Authentication**: `Bearer <JWT>` (JwtAuthGuard)

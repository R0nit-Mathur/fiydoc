# FiYDoc Professional Product Audit

**Audit date:** 4 October 2026
**Scope:** Expo SDK 57 client, NestJS/Prisma API, patient discovery/booking, doctor onboarding/workspace/profile, location, scheduling, visual system, accessibility, and cross-platform readiness.

The scores and findings below describe the original audit baseline, not a reassessment after implementation. See the dated follow-up at the end for actual changes and checks.

## Executive verdict

FiYDoc is **not launch-ready as a premium healthcare product**. The largest risk is not visual polish; it is **clinical identity and data truth**. The app currently mixes real server data, local persisted state, fabricated fallbacks, and role-specific defaults. That can show the wrong degree, specialty, experience, rating, location, clinic, token, or slot to a patient. In healthcare, that is a trust and safety failure before it is a design failure.

### Evidence-based scorecard

| Area | Score | Verdict |
|---|---:|---|
| Doctor identity/personalisation | 2/10 | Unsafe defaults and hardcoded degree/credential presentation |
| Patient experience | 4/10 | Good intent, but search, booking, and profile truth are inconsistent |
| Data consistency | 3/10 | Multiple sources of truth and silent save failures |
| Scheduling/slots | 4/10 | Server guardrails exist, but client fallbacks can contradict them |
| Location | 3/10 | Global blocking gate, limited hubs, and manual location marked as GPS |
| Clinical trust/compliance UX | 2/10 | UI claims verification that the code does not perform |
| Visual design | 5/10 | A token layer exists, but implementation is inconsistent and generic |
| Motion/interaction | 4/10 | Mostly entrance fades and press scale; no cohesive motion language |
| Accessibility | 4/10 | Some labels exist, but controls, focus, contrast, and semantics are uneven |
| Cross-platform readiness | 5/10 | Expo stack is viable; runtime validation could not run in this environment |

**Overall:** 3.6/10 for a premium healthcare product. Stabilise truth and workflows first, then invest in visual elevation.

## P0 — fix before user testing or public release

### P0.1 Doctor identity is not role- or credential-driven

**Evidence**

- `src/components/doctor/DoctorRegistrationView.tsx:177-198` defaults every new doctor to `MBBS` and `General Medicine`.
- `src/components/doctor/DoctorRegistrationView.tsx:1449` labels the non-PG path `No, General (MBBS)`.
- `src/app/(doctor)/(tabs)/profile.tsx:401-404` renders a hardcoded `MD` badge for every doctor.
- `src/app/(doctor)/(tabs)/profile.tsx:771-776` falls back to `MD (Medicine), MBBS`, an example registration number, and `National Medical Commission`.
- `backend/src/auth/auth.service.ts:289-303` and `backend/src/doctors/doctors.service.ts:295-301` auto-heal missing doctors as `General Medicine` with NMC defaults.
- `src/services/doctorVerificationService.ts:8-30` only models medical councils, not dental, AYUSH, nursing, allied health, or other professional regulators.

**Impact**

A BDS dentist can be presented as MD/MBBS; an AYUSH or allied-health professional is forced into an allopathic/NMC flow. This damages clinical trust and can create regulatory exposure.

**Required direction**

Create a credential taxonomy before redesigning screens:

```text
Professional type → regulator → primary degree → registration authority → speciality taxonomy → practice settings
```

Every label, upload requirement, credential badge, and validation rule must derive from that profile, never from a global MD default.

### P0.2 The product displays invented or fallback clinical facts

**Evidence**

- `src/components/ui/DoctorCard.tsx:125-127` displays `doctor.experienceYears || 1`.
- `src/components/ui/DoctorCard.tsx:138-143` always renders a rating pill with `0.0` and no review count.
- `src/app/(patient)/doctor/[id].tsx:214-241` fabricates morning/evening slots if the server returns no slots.
- `src/app/(patient)/booking/confirm.tsx:149-150` falls back to `04:15 PM` and `Token #12`.
- `src/app/(patient)/booking/confirm.tsx:162-164` falls back to `9876543210` as the patient phone.
- `src/app/(patient)/booking/confirm.tsx:404-405` falls back to `10 yrs exp` in the doctor summary.
- `src/app/(patient)/search.tsx:60-78` hardcodes a narrow symptom/specialty set centred around General Physician.

**Impact**

The app appears to know more than it actually knows. Patients can interpret a placeholder as a verified credential, live slot, experience figure, rating, location, or contact detail.

**Required direction**

Adopt a strict display contract: **known** values render; **not collected** values are omitted; **pending verification** is explicit; **unavailable** values are never fabricated. Remove medical and booking fallbacks from UI code. The server must be authoritative for doctor profile, fee, clinic, slot, capacity, token, and appointment status.

### P0.3 Verification UX claims capabilities that are not implemented

**Evidence**

- `src/components/doctor/DoctorRegistrationView.tsx:1669-1688` claims Aadhaar/Passport/Voter ID, DigiLocker OTP, UIDAI integration, and direct 256-bit encrypted integration.
- `src/components/doctor/DoctorRegistrationView.tsx:1691-1714` shows hardcoded `Verified`, `MMC-2015`, and `Completed` summary values.
- `src/components/doctor/DoctorRegistrationView.tsx:495-505` marks the ID as verified after a local 1.2-second timeout.
- `src/components/doctor/DoctorRegistrationView.tsx:629-648` submits uploaded documents, but local file URIs can be sent if background upload has not resolved.

**Impact**

This is a high-severity trust issue. A visual success state must never imply regulator, identity, or encryption verification that the backend did not complete.

**Required direction**

Split the flow into explicit states: `draft`, `uploaded`, `upload_failed`, `submitted`, `under_review`, `verified`, `rejected`, and `info_required`. Only the server can transition to `verified`. Remove hardcoded sample values from production UI.

### P0.4 Doctor registration data is submitted but not fully persisted

**Evidence**

- `src/components/doctor/DoctorRegistrationView.tsx:609-623` sends qualifications, license number, registration authority, and profile fields to `PATCH /doctors/me`.
- `backend/src/doctors/doctors.service.ts:685-697` does not include qualifications, license number, or registration authority in the update DTO.
- `backend/src/doctors/doctors.service.ts:763-801` updates doctor basics and clinic only; qualification and verification records are not updated by this path.
- The `Save draft & continue later` action at `src/components/doctor/DoctorRegistrationView.tsx:971-976` routes away without persisting the draft.

**Impact**

Doctors re-enter data, profiles revert to defaults, and the UI can report success while important fields remain unsaved. This directly matches the reported “fill them again and again” problem.

**Required direction**

Use one versioned `DoctorProfileDraft` contract shared by client and API. Persist drafts server-side after every completed section, return the saved profile from every mutation, and hydrate the form from the server on mount. Do not maintain a second untyped local representation.

## P1 — fix in the first stabilisation milestone

### P1.1 Patient search and booking are too narrowly physician-centric

`src/app/(patient)/search.tsx:60-78` hardcodes the search taxonomy around General Physician, Cardiologist, Dermatologist, Dentist, and a few others. The taxonomy also duplicates `General Physician` and `General Medicine` in `src/constants/specialties.ts:36-52`, while `getSpecialtyConfig()` falls back to the first entry for unknown specialties (`:242-282`).

This causes non-matching professionals to appear as generalists and makes search semantics inconsistent between registration, directory, booking, and prescription views. Replace display-name matching with canonical specialty IDs and profession-aware categories. A patient should search by concern, speciality, provider type, clinic, language, or availability without the system silently changing provider identity.

### P1.2 Profile fields are duplicated and inconsistently named

The client uses `specialty`, `specialization`, `qualification`, `qualifications`, `clinicAddress`, `location`, `hospital`, and `clinic`. The server has separate `Doctor`, `DoctorQualification`, `Clinic`, and `DoctorVerification` models, but the client maps them into loose `any` objects in several flows.

Examples:

- `src/services/authService.ts:94-100` maps `specialization` and `specialty` to the same value.
- `src/types/index.ts:34-78` requires `experienceYears`, `rating`, `hospital`, and `avatar` even when the API may return `0`, `null`, or no value.
- `src/services/patientService.ts:3-18` exposes `conditions`, while booking writes `chronicConditions` through a raw `apiClient` call at `src/app/(patient)/booking/slot-select.tsx:277-285`.

Create canonical DTOs and mapper functions. Stop passing untyped route params for clinical data; route params should carry IDs, then screens should query authoritative records.

### P1.3 Slot generation has two competing sources of truth

The server has meaningful scheduling logic and concurrency checks (`backend/src/appointments/appointments.service.ts:309-383`), but the client also persists booking state and slot occupancy in `src/store/useAppointmentStore.ts:89-212`. The doctor profile then invents fallback slots in `src/app/(patient)/doctor/[id].tsx:214-241` when the server has no slots.

Additional risks:

- `src/app/(patient)/doctor/[id].tsx:126-137` chooses dates using the device clock, while the server also applies date/time rules.
- `src/app/(patient)/booking/slot-select.tsx:271` and `src/app/(patient)/booking/confirm.tsx:148` use UTC-derived date fallbacks, while other code uses local dates.
- `backend/src/appointments/appointments.service.ts:284-301` does not clearly reject a slot outside all availability windows.
- A changed date/session can retain `selectedSlotIndex`, making the selected item unstable when list lengths differ.

Use an API response such as `{ date, timezone, slots, capacity, bookedCount, status, reason }`. The client should render only those slots. Add server tests for timezone, past dates, outside-hours slots, leave, breaks, delays, capacity, duplicate booking, and reschedule.

### P1.4 Location is globally blocking and semantically incorrect

**Evidence**

- `src/app/_layout.tsx:21-31` renders a global location gate for the entire app, including authentication, onboarding, and doctor flows.
- `src/app/_layout.tsx:30` passes `onClose={() => {}}`; the modal's close control therefore cannot actually dismiss the gate.
- `src/components/location/LocationPermissionModal.tsx:219-222` promises that users can pick a city or browse nationwide, but the component renders only permission/settings/retry actions (`:242-293`). `LocationPickerModal` exists but is not connected here.
- `src/store/useLocationStore.ts:217-231` defaults a failed GPS lookup to Connaught Place and sets `isGenuineDeviceLocation: true`.
- `src/store/useLocationStore.ts:316-338` marks manually selected hubs and manual locations as genuine device locations.

This blocks users who do not grant location and can label a manual/default location as GPS-derived. Location should be optional, role-aware, and clearly labelled as `GPS`, `selected city`, or `last known`. Default to nationwide search when denied; ask for location only when proximity is useful.

### P1.5 Patient data is not treated as first-class structured data

Booking confirmation uses a mix of route params, local draft, and user profile. Missing phone defaults to a real-looking number, age/gender can remain blank, allergies/conditions are concatenated into appointment notes, and uploaded files are saved through background calls.

For a clinical product, appointment intake should be an immutable structured snapshot with consent, source, timestamp, and attachment status. Do not overload free-text notes as a data transport layer.

## P1 — visual, interaction, and accessibility audit

### Why it currently feels like a low-cost app

The project has a useful token file (`DESIGN_TOKENS.md`) and a growing component library, but the implementation does not behave like one coherent design system:

- Screens mix `StitchColors`, `Palette`, `Colors`, NativeWind classes, and one-off hex values.
- `src/app/(onboarding)/role-select.tsx:94-146` hardcodes most colors instead of consuming the theme.
- `src/components/ui/DoctorCard.tsx:176-320` hardcodes card, badge, spacing, and shadow values despite shared tokens existing.
- Typography has a large token surface, but many screens use one-off sizes and weights; the same product alternates between dense uppercase micro-labels and oversized headings.
- The visible style is mostly white cards, pills, shadows, and blue/teal accents. There is not yet a distinctive FiYDoc visual signature.

The result is “assembled screens” rather than a premium product system. A $1M-feeling app needs fewer patterns, stronger hierarchy, fewer borders, better whitespace, and a consistent visual grammar across patient and clinician modes.

### Motion audit

There is animation code (`react-native-reanimated`, `FadeIn`, `AnimatedPressable`, haptics), but it is mainly entrance animation and press scaling. It does not yet create fluid task flows.

Priorities:

1. Add a shared motion spec: micro 160–220ms, content 280–420ms, spring only for direct manipulation.
2. Animate state transitions, not just initial mount: selected date, selected slot, role switch, step progress, save success, sheet presentation, and list updates.
3. Add reduced-motion handling and avoid animating large scroll lists unnecessarily.
4. Use layout transitions or coordinated opacity/transform transitions so cards do not pop in or reorder abruptly.
5. Make loading states feel intentional: skeletons should preserve final geometry, and error/retry states should replace the skeleton rather than overlay it.

### Accessibility and mobile ergonomics

The code includes several good `accessibilityLabel` usages, but the audit still finds systemic gaps:

- Many selectable chips, gender options, specialty filters, schedule controls, and upload controls do not expose selected/disabled state consistently.
- Several icon-only actions rely on labels but lack a clear `accessibilityState` or hint.
- Text sizes of 11–13px are common for important clinical metadata. Keep body and actionable text comfortably readable and allow Dynamic Type where feasible.
- Multiple controls use `hitSlop` but have a visual target smaller than a comfortable 44×44 touch target.
- Contrast and semantic status are not consistently derived from the theme, especially in hardcoded badge colors.
- Native/browser behaviour differs: `Alert`, blur, shadows, modal presentation, and location permission flows are not guaranteed to feel equivalent on iOS, Android, and web.
- Large result sets are rendered through `ScrollView` plus `.map()` in discovery, search, appointments, notifications, and directories. This will degrade as real inventory grows; use `FlatList` or FlashList with stable keys and pagination.

### Platform readiness

The dependency set is appropriate for an Expo SDK 57 app, but the environment used for this audit did not have Node or pnpm installed, so TypeScript, lint, and web export could not be executed here. Treat cross-platform readiness as unverified until CI or a development machine runs:

```bash
npx tsc --noEmit
pnpm run lint
npx expo export --platform web --output-dir /private/tmp/fiydoc-export
```

Then smoke-test a real iOS device/simulator, Android device/emulator, and web viewport at 375px, 768px, and desktop width. The root layout currently uses a 640px web container (`src/app/_layout.tsx:101-107`), which is acceptable for a mobile-web shell but not a responsive desktop product surface.

## Product architecture recommendations

### 1. Establish a single domain model

Create a shared contract package or generated API types for:

- `ProviderIdentity`
- `ProfessionalCredential`
- `ProviderPractice`
- `ProviderAvailability`
- `PatientProfile`
- `AppointmentIntake`
- `AppointmentSlot`
- `VerificationState`
- `LocationContext`

Every screen should consume these models through one mapper. A screen must not invent a value when a mapper returns `null`.

### 2. Split onboarding by professional type

Replace the current all-doctor funnel with:

1. Choose provider type.
2. Choose regulator/credential family.
3. Collect identity and contact details.
4. Collect credential details relevant to that family.
5. Add speciality/services.
6. Add practice locations.
7. Configure availability and visit modes.
8. Review exact public profile.
9. Submit verification.

Patients should have a short, privacy-minimised profile flow. Do not ask for clinical fields that are not needed for discovery, booking, or safe care.

### 3. Make saving explicit and recoverable

Use section-level save states: `Not started`, `In progress`, `Saved`, `Needs attention`, `Submitted`. Show the last saved time and allow resume from any step. Never swallow a server error and then say “saved locally” unless the UI clearly labels the local-only state.

### 4. Make booking a trustworthy transaction

The flow should be:

```text
Provider profile → server availability → slot reservation → intake → review exact snapshot → server booking → receipt
```

No fabricated slots, fees, tokens, doctor details, or patient contact information. Use an idempotency key for booking and return one authoritative receipt.

## Premium redesign direction

Do not start by adding gradients or more animation. Start with product hierarchy:

- Use a calm clinical neutral background, one primary brand colour, one semantic success colour, and restrained status colours.
- Make doctor identity the hero: real name, verified credential type, specialty, clinic, next live availability.
- Use one card language, one radius scale, one shadow strategy, and one icon family.
- Replace dense pill forests with grouped sections and clear headings.
- Design patient and clinician dashboards as two distinct products sharing tokens, not as one generic shell with different labels.
- Use progressive disclosure for credentialing, medical intake, practice settings, and payment/payout features.

## Recommended delivery roadmap

### Phase 0 — truth and safety, 3–5 days

- Remove all fabricated clinical, identity, booking, rating, phone, and location values.
- Disable fallback slots; render a truthful unavailable state.
- Remove hardcoded MD/MBBS/NMC/Aadhaar/DigiLocker claims and sample verification values.
- Fix location semantics and make the gate optional outside proximity-dependent discovery.
- Add telemetry for failed saves, booking conflicts, slot mismatches, and verification state changes.

### Phase 1 — domain model and persistence, 1–2 weeks

- Introduce canonical provider/patient/credential/availability DTOs.
- Add server-side draft persistence and resume support.
- Separate qualification records from display labels.
- Add professional-type/regulator-aware onboarding.
- Make profile and booking screens query server data by ID rather than carrying clinical data in route params.

### Phase 2 — scheduling correctness, 1 week

- Define one timezone policy and use it end-to-end.
- Make slot availability API-authoritative with capacity and reservation state.
- Add idempotent booking and conflict recovery.
- Add tests for availability, breaks, leave, delays, reschedules, duplicate submissions, and time boundaries.

### Phase 3 — premium product system, 1–2 weeks

- Consolidate theme tokens and remove one-off visual values.
- Rebuild shared cards, section headers, inputs, segmented controls, sheets, empty states, and status badges.
- Add a motion system with reduced-motion support.
- Replace large `ScrollView`/`.map()` feeds with virtualized lists.
- Run accessibility checks and device-level visual QA.

### Phase 4 — polish and growth

- Add reviews only when real review data exists.
- Add richer provider profiles, services, languages, and care modes.
- Add analytics for search-to-profile, profile-to-slot, booking success, onboarding completion, and save-resume rate.

## Acceptance gates for a premium release

- A BDS, MD, BAMS, BHMS, dentist, surgeon, or allied professional sees only their own degree, regulator, and speciality vocabulary.
- A patient never sees a made-up doctor experience, rating, token, fee, phone, clinic, or slot.
- Every completed onboarding section survives logout, reinstall-safe server resume, and re-login.
- A denied location permission still allows the app to function with an explicit nationwide/manual mode.
- The booking receipt exactly matches the server appointment, including local date, timezone, fee, clinic, slot, and token.
- Verification status is server-backed and never simulated by a timer.
- TypeScript, lint, web export, iOS smoke test, Android smoke test, and accessibility checks pass in CI.

## Bottom line

The app should not be polished on top of the current foundation. First make it **truthful, role-aware, resumable, and server-authoritative**. Then redesign the shared visual system and interaction layer. That order is what separates a credible clinical product from an expensive-looking prototype.

## Implementation follow-up — 5 October 2026

The interrupted refresh/auth/UI pass has been preserved and its remaining targeted fixes integrated locally:

- API requests compose caller cancellation with a 12-second timeout, keep the timeout through body parsing, clean resources, support 204 responses and reject obsolete authenticated results. Old-account 401 responses cannot expire a newer session.
- Prescription list/detail use `src/utils/prescriptionMapper.ts`. Missing advice, dosing, duration, demographics, preparation, dates and signatures remain unknown. Route/account changes abort obsolete requests; duplicate refreshes do not send duplicate requests. A missing prescription never substitutes the first stored record.
- The health hub trusts successful server lists (including empty lists); cached prescriptions require exact ownership rather than name matching. Refresh no longer combines prescription refetch with invalidation of the same query.
- Prescription modal/list no longer imply verification from a record code or show fabricated demographics. Sharing failures/dismissals are not reported as completed downloads.
- Appointment cancellation updates local state/cache and navigates only after server success. Rapid repeat confirmations are blocked; the dialog stays busy while pending. Fetch failures show retry states or a warning alongside saved details. Missing bookings cannot render a confirmed pass, and the decorative QR icon has been replaced with a record icon.
- Skeletons respect reduced motion, use theme colours, stay out of the accessibility tree and cancel loops on unmount. Confirmation feedback is a brief Reanimated fade with no infinite ripple. Native stack transitions respect reduced motion.

### Checks actually run after integration

- `pnpm exec node --test tests/*.test.cjs` — **30 passed**. Tests transpile actual TypeScript with the installed compiler and mock network, stores, hooks and navigation. They are focused logic/lifecycle regressions, not rendered React Native or end-to-end device tests.
- `pnpm exec tsc --noEmit` — passed.
- `pnpm --dir backend exec tsc --noEmit` — passed.
- Backend `pnpm run build` — passed, including Prisma Client generation; no migration or database writes were run.
- `pnpm exec expo export --platform web --output-dir <approved-temp>/fiydoc-resume-export` — passed, 89 static routes; main JavaScript bundle remains approximately 5.5 MB. Existing web push-listener and forced-exit warnings remain.
- `git diff --check` — passed.
- Lint remains unavailable: no ESLint dependency/configuration is installed. The earlier failed automatic installation was not repeated.

### Runtime acceptance still required

1. On iOS/Android and browser, test slow first load, empty results, offline refresh with cached records and retry recovery. Confirm one request per prescription refresh and that loading clears.
2. Sign out while private requests are pending, then sign in as a different account. Verify no previous-account content appears, including after restart.
3. Open an unknown prescription ID, switch routes during a delayed response, and inspect a record with incomplete medicine fields. No other record or suggested dose should appear.
4. Fail cancellation, then succeed; double-tap confirmation. Failure must keep the appointment active without navigation; success must show the server's cancelled status. Never retry uncertain server writes automatically.
5. Check reduced motion, dark mode, large text, screen readers, and phone/tablet/laptop/foldable layouts. Dismiss sharing and try missing PDFs; neither should claim a completed download.

No deployment or commit occurred. Unrelated `Clover-Legends-Short.mp4` was preserved. This is not full launch acceptance: device QA, lint setup, measured performance, canonical identity alignment and the rest of the audit roadmap remain open. Cached prescription fallback intentionally refuses unmatched account/patient IDs; differing canonical IDs require a fresh authorized fetch until identity contracts are aligned.

## Pre-commit runtime-log and data-preservation fixes — 5 October 2026

- Reproduced the reported doctor-home error by transpiling its actual loading JSX: inline whitespace became a literal string child of `View`. Corrected that element and added regression checks for emitted text children, queue loading/error recovery and unverified users.
- Web shadows now use `boxShadow`; native shadow/elevation definitions remain unchanged. Overlay `pointerEvents` live in styles. Remaining core Animated drivers are native-only and have cleanup. These changes retain the current restrained, Health-inspired visual system rather than replace the app's design.
- Web-specific push/local-notification modules keep the native Expo notification module out of the web dependency graph. In-app notifications and native push remain supported. Foreground native listeners use the current account, do not log private notification contents and do not reschedule a received banner.
- OTA checks are restricted to enabled native release builds, both at startup and in the update service. React DevTools and “development optimizations off” messages are expected in development, not application failures.
- Doctor-profile refresh timeouts show retry feedback while keeping current saved values and open drafts. Failed profile/fee/photo saves no longer report local edits as server-confirmed success. Qualification edits are actually submitted; returned verification status stays server-authoritative.
- Registration submits actual regulator/registration fields, not `PENDING` over existing credentials. Failed profile/document submissions keep the user in the flow with an error instead of reporting successful completion.
- Profile, credential and availability writes are grouped in a Prisma transaction. Invalid credential input cannot wipe existing degrees; legacy text edits preserve recorded institution/year. Identical qualifications do not reset verification. Unchanged clinic timing text and duration-only edits retain custom operating days and shift IDs.
- Schedule settings replace only explicitly edited shift periods, retaining other periods and existing days. Incomplete/invalid input fails before writes. Date-specific duration/capacity overrides do not change weekly defaults; schedule replacement failures roll back. Non-owner settings writes are refused.
- Verification resubmission with omitted documents retains existing uploads. Render's build command no longer runs `prisma db push`: build/install are separated from any future reviewed migration.

### Existing-user safety and release boundary

`backend/prisma/schema.prisma` and all migrations are unchanged. No database reset, schema push, seed, migration, production query/write or deployment was executed. Data-preservation tests exercise the actual service with an in-memory transactional mock, including failed writes; they are not proof from a restored production database. Before any future schema migration, take a database backup, verify restoration in staging, review generated SQL, then explicitly approve deployment.

The scoped changes are prepared on `R0nit-Mathur/fix/clinical-flow-web-hardening`, not `main`; unrelated video and local environment files are excluded from commits. The GitHub CLI is not installed, so branch publication uses Git directly, not a claimed pull request.

Latest validation passed: `pnpm test` (**63 tests**), `pnpm exec tsc --noEmit`, `pnpm --dir backend exec tsc --noEmit`, `pnpm --dir backend build`, web export and `git diff --check`. The latest pre-commit web export produced 89 routes and approximately 5.4 MB of main JavaScript, with none of the reported shadow/push warnings. Expo still prints its existing forced-exit notice.

The built-in browser timed out opening the local exported preview and created no tab, so no interactive visual acceptance is claimed. Run `pnpm run web` locally to verify login, signed-in doctor/patient work, failed saves, refresh and logout. Native device, screen-reader, tablet/foldable and full visual QA, lint configuration and measured startup/API performance remain open; do not interpret a source fix or commit as Apple Health-level release certification.

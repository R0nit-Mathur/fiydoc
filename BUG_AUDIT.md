# BUG_AUDIT.md — FiYDoc Client Audit & Resolution Report

Audit conducted prior to NestJS backend integration per Section 2 of FiYDoc Master Specification.

## 1. Scope Reconciliation & Feature Flagging
- **Out-of-Scope Features Isolated**:
  - `ENABLE_PHARMACY: false`
  - `ENABLE_LAB_TESTS: false`
  - `ENABLE_SOS_EMERGENCY: false`
  - `ENABLE_3D_BODY_VISUALIZATION: false`
  - `ENABLE_AI_OCR_SCANNER: false`
  - `ENABLE_PAYMENTS: false`
- Out-of-scope code preserved under `src/constants/featureFlags.ts` without deletion per prompt instructions.

## 2. Client Audit Findings & Status

| ID | Issue Description | Severity | Component / Screen | Status |
|---|---|---|---|---|
| **BUG-01** | `NativeWind` Metro transformer crash on EAS build (`Cannot read properties of undefined (reading 'transformFile')`) | **Blocker** | `metro.config.js` | **RESOLVED** — Fixed transformer initialization fallback & synchronized SDK 57 dependencies |
| **BUG-02** | Missing `babel-preset-expo` in `package.json` `devDependencies` causing Gradle build task failure in EAS Cloud | **Blocker** | `package.json` | **RESOLVED** — Added `babel-preset-expo@57.0.10` to devDependencies |
| **BUG-03** | Local `eas-cli` devDependency version mismatch causing `expo-doctor` project check warning | **Major** | `package.json` | **RESOLVED** — Removed local `eas-cli` devDependency, switched to global/dlx runner |
| **BUG-04** | Deprecated SDK module versions causing 2 check failures in `expo-doctor` | **Major** | `package.json` | **RESOLVED** — Updated to exact Expo SDK 57 release versions (21/21 checks passed) |
| **BUG-05** | Missing `health/[id]` hidden route declaration in Patient Layout causing router navigation warning | **Minor** | `app/(patient)/_layout.tsx` | **RESOLVED** — Registered `health/[id]` and `notifications` in hidden tab screen options |
| **BUG-06** | Hardcoded mock data shapes in components expecting real backend DTO fields | **Major** | `services/` | **IN PROGRESS** — Rebuilding client service layer domain-by-domain to map real NestJS API DTOs |

## 3. Verification Summary
- **Type Check**: Clean (`npx tsc --noEmit` — 0 errors).
- **Expo Doctor Check**: Clean (`21/21 checks passed. No issues detected!`).
- **Export Bundle Check**: Clean (`_expo/static/js/ios/entry.hbc` 6.0MB & `_expo/static/js/android/entry.hbc` 6.2MB generated).

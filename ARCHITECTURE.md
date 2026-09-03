# FiYDoc Architecture Overview

## Tech Stack
- **Framework**: Expo (React Native + TypeScript + Expo Router SDK 52+)
- **Package Manager**: `pnpm`
- **State Management**: `Zustand` with `@react-native-async-storage/async-storage` persistence.
- **Data Fetching / Query**: `@tanstack/react-query` wrapping simulated async mock services.
- **Styling**: NativeWind / Tailwind CSS utilities + custom themed design system.

## Directory Structure
```
fiydoc/
├── app/                      # Expo Router File-based Routes
│   ├── _layout.tsx           # Global Root Layout (QueryClientProvider, Providers)
│   ├── (auth)/               # Auth Routes (welcome, login, signup, otp, reset-password)
│   ├── (onboarding)/         # Progressive Role Onboarding (role-select, patient-steps, doctor-steps)
│   ├── (patient)/            # Patient App Stack (tabs: home, discovery, health, pharmacy, profile)
│   └── (doctor)/             # Doctor App Stack (tabs: home, appointments, directory, workspace, schedule)
├── components/               # Reusable UI & Business Components
│   ├── ui/                   # Button, Input, Card, DoctorCard, AppointmentCard, Badge, BottomSheet, Modal, Tabs, Skeleton, EmptyState, Toast, Timeline, StatCard
│   ├── patient/              # OCR Scanner simulator, Prescription viewer, SOS modal
│   └── doctor/               # BodyRegion3D visualizer, Prescription generator, Verification tracker
├── services/                 # Mock Service Layer (simulates latency & success/error)
│   ├── mockData.ts           # Central realistic seed data (Doctors, Patients, Prescriptions, Labs, Medicines)
│   ├── authService.ts
│   ├── doctorService.ts
│   ├── appointmentService.ts
│   ├── healthService.ts
│   ├── pharmacyService.ts
│   ├── labService.ts
│   └── notificationService.ts
├── store/                    # Zustand Stores with AsyncStorage
│   ├── useAuthStore.ts
│   ├── useAppointmentStore.ts
│   ├── useHealthStore.ts
│   ├── usePharmacyStore.ts
│   └── useNotificationStore.ts
├── hooks/                    # Custom Query & Mutation Hooks
└── constants/                # Theme, Colors, Config
```

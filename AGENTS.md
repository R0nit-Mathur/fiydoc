# Repository Guidelines

## Project Structure & Module Organization

FiYDoc is an Expo Router mobile client with a NestJS/Prisma API.

- `src/app/` contains file-based routes. Keep patient, doctor, auth, and onboarding flows inside their existing route groups.
- `src/components/` contains reusable UI; place design-system primitives in `src/components/ui/` and feature-specific components in a named subdirectory.
- `src/services/` owns HTTP and external integrations; `src/hooks/queries/` owns React Query hooks; `src/store/` holds persisted Zustand state.
- `src/constants/` holds tokens and feature flags. Reuse `Palette`, spacing, and shared UI primitives instead of introducing one-off visual values.
- `backend/src/` is organized by Nest modules; Prisma schema, migrations, and seed data live in `backend/prisma/`.
- Static images belong in `assets/images/`.

## Build, Test, and Development Commands

Run client commands from the repository root:

- `pnpm run start` — launch Expo development server.
- `pnpm run ios`, `npm run android`, or `npm run web` — launch a platform target.
- `npx tsc --noEmit` — required TypeScript check for client changes.
- `npx expo export --platform web --output-dir /private/tmp/fiydoc-export` — production bundle smoke test.

Run API commands from `backend/`:

- `pnpm run start:dev` — start Nest with watch mode.
- `pnpm run build` — generate Prisma client and compile the API.
- `pnpm run prisma:migrate` — create/apply a development migration; review generated SQL before committing it.

## Coding Style & Naming Conventions

Use TypeScript, 2-space indentation, single quotes, and named exports for shared components. Route files follow Expo conventions (`[id].tsx`, `_layout.tsx`); components use PascalCase; hooks begin with `use`; service methods are camelCase. Keep mobile UI concise, accessible, and role-focused. Prefer `StyleSheet` or existing NativeWind patterns within a file—do not mix arbitrary new styling systems.

## Testing Guidelines

There is no unit-test runner configured yet. For every client change, run the TypeScript check and a platform export. For API changes, run `npm run build` in `backend/`. Add focused tests alongside new business-critical backend behavior when introducing a test framework; do not claim coverage that is not measured.

## Commit & Pull Request Guidelines

Use Conventional Commit-style messages seen in history: `feat(ui): simplify booking`, `fix(auth): map registration fields`, or `chore: update config`. Keep commits scoped. PRs should describe the user-facing change, note API/schema impacts, link the issue when available, and include mobile screenshots for visual changes. Call out migrations, environment variables, and manual verification steps explicitly.

## Security & Configuration

Never commit `.env` values, tokens, patient data, or production credentials. Use `EXPO_PUBLIC_API_URL` only for public client configuration. Treat medical identity and appointment status as server-authoritative; do not represent pending credentials or unsaved appointments as confirmed.

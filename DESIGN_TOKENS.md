# FiYDoc Design System & Tokens

Extracted from Stitch reference (Project 6559997197545880152) + actual `src/constants/theme.ts`.
Updated to reflect Stitch design: `#1450A3` primary, `#00A896` teal.

## Color Palette

### Primary Brand — Royal Blue
- **Primary**: `#1450A3` (Royal Medical Blue — primary actions, active states)
- **Primary Navy**: `#00397E` (Deep navy — emphasis, clinical headers)
- **Primary Light**: `#EAEDFF` (Surface tint — chips, pills)
- **Primary Border**: `#ADC6FF` (Border tint)
- **Primary Highest**: `#DAE2FD` (Darkest surface tint)

### Secondary — Vitality Teal
- **Teal**: `#00A896` (Vitality Teal — verified badges, success states, secondary actions)
- **Teal Deep**: `#006B5F` (Deep teal — emphasis)
- **Teal Light**: `#E0F7F5` (Surface tint)
- **Teal Border**: `#76F4E0` (Border tint)

### Background Surfaces (Light Mode)
- **Background**: `#FAF8FF` (Soft ice white — app background)
- **Surface Low**: `#F2F3FF` (Input backgrounds, lowest elevation)
- **Surface Track**: `#EAEDFF` (Segmented controls, chips)
- **Surface High**: `#E2E7FF` (Elevated surfaces)
- **Card**: `#FFFFFF` (Pure white — card surfaces)

### Text
- **Text Primary**: `#131B2E` (Dark slate navy — headings, primary content)
- **Text Secondary**: `#424752` (Readable muted slate — body text, labels)
- **Text Muted**: `#64748B` (Subtle slate — captions, placeholders)
- **Outline**: `#737783` (Input outlines)
- **Border**: `#E2E8F0` (Default borders)

### Status Colors
- **Success**: `#00A896` / `#34D399` (dark)
- **Success BG**: `#E0F7F5` / `rgba(0,168,150,0.18)` (dark)
- **Warning**: `#F59E0B` / `#FBBF24` (dark)
- **Warning BG**: `#FFFBEB` / `rgba(245,158,11,0.18)` (dark)
- **Danger**: `#BA1A1A` / `#F87171` (dark)
- **Danger BG**: `#FFDAD6` / `rgba(186,26,26,0.2)` (dark)

### Dark Mode Background
- **Background**: `#0B1120` (Deep navy)
- **Card**: `#131B2E`
- **Surface Low**: `#0F172A`
- **Surface Track**: `#1E293B`
- **Surface High**: `#283044`

## Typography
- **Display**: 30px / 700 / -0.5 letter-spacing
- **H1**: 24px / 700 / -0.3 letter-spacing
- **H2**: 18px / 700
- **H3**: 15px / 600
- **Body**: 14px / 400
- **Caption**: 12px / 500
- **Label**: 11px / 800 uppercase / 0.5 letter-spacing
- **Button**: 14px / 700

## Spacing
- `xs`: 4, `sm`: 8, `md`: 12, `lg`: 16, `xl`: 20, `2xl`: 24, `3xl`: 32, `4xl`: 40, `5xl`: 48, `6xl`: 64

## Border Radius
- `sm`: 8, `md`: 12, `lg`: 16, `xl`: 20, `2xl`: 24, `full`: 9999

## Shadows (iOS)
- **Subtle**: 0 1px 3px rgba(0,0,0,0.04) — inputs, pills
- **Card**: 0 4px 12px rgba(0,0,0,0.05) — cards, buttons
- **Modal**: 0 12px 32px rgba(0,0,0,0.12) — modals, bottom sheets
- **Focus**: 0 0px 0px 3px rgba(0,122,255,0.15) — input focus rings

/**
 * Prescription shorthand constants for quick-insert suggestions in E-Prescription Builder.
 * Based on common Indian medical practice abbreviations.
 */

export const FREQUENCY_SHORTCUTS = [
  { label: 'OD', full: 'Once Daily', hint: '(Morning)' },
  { label: 'BD', full: 'Twice Daily', hint: '(After breakfast & dinner)' },
  { label: 'TDS', full: 'Thrice Daily', hint: '(After each meal)' },
  { label: 'QID', full: '4 Times Daily', hint: '(Every 6 hrs)' },
  { label: 'HS', full: 'At Night', hint: '(Bedtime only)' },
  { label: 'PRN', full: 'As Needed', hint: '(SOS / When required)' },
  { label: 'AC', full: 'Before Meals', hint: '(30 min before food)' },
  { label: 'PC', full: 'After Meals', hint: '(Immediately after food)' },
];

export const DURATION_SHORTCUTS = [
  { label: '3 days', value: '3 days' },
  { label: '5 days', value: '5 days' },
  { label: '7 days', value: '7 days' },
  { label: '14 days', value: '14 days' },
  { label: '30 days', value: '30 days' },
  { label: '3 months', value: '3 months' },
];

export const INSTRUCTION_SHORTCUTS = [
  { label: 'After meals', value: 'Take after meals with warm water.' },
  { label: 'Before meals', value: 'Take 30 minutes before food.' },
  { label: 'With food', value: 'Take with food to reduce stomach upset.' },
  { label: 'At bedtime', value: 'Take at bedtime.' },
  { label: 'Empty stomach', value: 'Take on empty stomach in the morning.' },
  { label: 'SOS', value: 'Take only if symptoms worsen.' },
  { label: 'No alcohol', value: 'Avoid alcohol during this course.' },
];

export const COMMON_DIAGNOSIS_SHORTCUTS = [
  { label: 'Acute Febrile Illness', value: 'Acute Febrile Illness' },
  { label: 'URI', value: 'Upper Respiratory Tract Infection' },
  { label: 'LRI', value: 'Lower Respiratory Tract Infection' },
  { label: 'HTN', value: 'Hypertension (Stage 1)' },
  { label: 'DM Type 2', value: 'Diabetes Mellitus Type 2' },
  { label: 'Dyspepsia', value: 'Functional Dyspepsia' },
  { label: 'GERD', value: 'Gastroesophageal Reflux Disease' },
  { label: 'URTI', value: 'Acute URTI with Fever' },
  { label: 'Tonsillitis', value: 'Acute Tonsillitis' },
  { label: 'Acute Bronchitis', value: 'Acute Bronchitis' },
];

/**
 * Utility to normalize and clean allergy inputs.
 * If a patient types 'none', 'no', 'na', 'n/a', 'nil', 'nothing', 'no allergies', etc.,
 * it should resolve to 0 allergies (empty array) across the entire app.
 */

const NEGATIVE_ALLERGY_TERMS = new Set([
  'none',
  'no',
  'na',
  'n/a',
  'nil',
  'nothing',
  'no allergy',
  'no allergies',
  'none known',
  'no known allergy',
  'no known allergies',
  'nkda', // No Known Drug Allergies
  'nka',  // No Known Allergies
  'null',
  'not applicable',
  'zero',
  '0',
  '-',
  '--',
]);

export function isNegationAllergy(item: string): boolean {
  if (!item) return true;
  const clean = item.trim().toLowerCase().replace(/[^a-z0-9/]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return true;
  return NEGATIVE_ALLERGY_TERMS.has(clean) || NEGATIVE_ALLERGY_TERMS.has(item.trim().toLowerCase());
}

export function normalizeAllergies(input: string | string[] | null | undefined): string[] {
  if (!input) return [];

  let rawList: string[] = [];
  if (Array.isArray(input)) {
    rawList = input;
  } else if (typeof input === 'string') {
    rawList = input.split(',').map((s) => s.trim());
  }

  // Filter out empty items and negation terms
  return rawList
    .map((s) => s.trim())
    .filter((s) => Boolean(s) && !isNegationAllergy(s));
}

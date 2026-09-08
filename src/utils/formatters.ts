/**
 * Apple Health-grade Human Readable Formatters
 */

export function formatHumanDate(dateString?: string | null): string {
  if (!dateString) return 'Today';

  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    // Fallback
  }

  return dateString;
}

export function formatFullDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } catch {}
  return dateString;
}

export function formatTimeSlot(timeStr?: string | null): string {
  if (!timeStr) return '';
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${mStr} ${ampm}`;
  }
  return timeStr;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Accurately calculate age from date of birth string.
 * Supports ISO, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY formats.
 */
export function calculateAgeFromDOB(dobString?: string | null): number | null {
  if (!dobString) return null;
  const trimmed = dobString.trim();
  if (!trimmed) return null;

  // Try standard parse
  let birthDate: Date | null = null;

  // Check for DD/MM/YYYY or DD-MM-YYYY
  const parts = trimmed.includes('/')
    ? trimmed.split('/')
    : trimmed.includes('-')
    ? trimmed.split('-')
    : null;

  if (parts && parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      birthDate = new Date(y, m, d);
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      birthDate = new Date(y, m, d);
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) {
    birthDate = new Date(trimmed);
  }

  if (!birthDate || isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 && age <= 130 ? age : null;
}

export function formatDOB(dobString?: string | null): string {
  if (!dobString) return '';
  const trimmed = dobString.trim();
  const age = calculateAgeFromDOB(trimmed);
  const formatted = formatHumanDate(trimmed);
  if (age !== null) {
    return `${formatted} (${age} yrs)`;
  }
  return formatted;
}

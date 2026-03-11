/**
 * JMBG (Unique Master Citizen Number) validator.
 * Format: 13 digits with modulo-11 check digit.
 * Returns error message string if invalid, null if valid.
 */
export function validateJMBG(jmbg: string): string | null {
  if (!jmbg) return null; // optional field
  if (!/^\d{13}$/.test(jmbg)) {
    return 'JMBG mora imati tacno 13 cifara';
  }
  const d = jmbg.split('').map(Number);
  const sum =
    7 * (d[0] + d[6]) +
    6 * (d[1] + d[7]) +
    5 * (d[2] + d[8]) +
    4 * (d[3] + d[9]) +
    3 * (d[4] + d[10]) +
    2 * (d[5] + d[11]);
  let check = 11 - (sum % 11);
  if (check > 9) check = 0;
  if (d[12] !== check) {
    return 'JMBG nije validan';
  }
  return null;
}

/**
 * PIB (Tax Identification Number) validator.
 * Must be exactly 9 digits.
 * Returns error message string if invalid, null if valid.
 */
export function validatePIB(pib: string): string | null {
  if (!pib) return null; // optional field
  if (!/^\d{9}$/.test(pib)) {
    return 'PIB mora imati tacno 9 cifara';
  }
  return null;
}

/**
 * MB (Registration Number) validator.
 * Must be exactly 8 digits.
 * Returns error message string if invalid, null if valid.
 */
export function validateMB(mb: string): string | null {
  if (!mb) return null; // optional field
  if (!/^\d{8}$/.test(mb)) {
    return 'MB mora imati tacno 8 cifara';
  }
  return null;
}

/**
 * Email validator.
 * Basic regex check. Returns null if valid or empty (email is optional).
 */
export function validateEmail(email: string): string | null {
  if (!email) return null; // optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email adresa nije validna';
  }
  return null;
}

/**
 * Phone validator.
 * Must start with + or digit, allow digits/spaces/hyphens, min 6 chars.
 * Returns null if valid or empty (phone is optional).
 */
export function validatePhone(phone: string): string | null {
  if (!phone) return null; // optional field
  if (!/^[+\d][\d\s\-]{4,}[\d]$/.test(phone)) {
    return 'Broj telefona nije validan';
  }
  return null;
}

/**
 * Required field validator.
 * Returns error with field name if empty/whitespace, null if valid.
 */
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) {
    return `${fieldName} je obavezno polje`;
  }
  return null;
}

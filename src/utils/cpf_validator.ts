const ALL_DIGITS_EQUAL = /^(\d)\1{10}$/;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function checkDigit(digits: string, factor: number): number {
  let sum = 0;
  for (const digit of digits) {
    sum += Number(digit) * factor;
    factor -= 1;
  }
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

/**
 * Valida o formato e os dígitos verificadores (Módulo 11) de um CPF.
 * Aceita tanto CPF formatado (com pontuação) quanto apenas dígitos.
 */
export function isValidCpf(value: string | undefined | null): boolean {
  if (!value) return false;

  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (ALL_DIGITS_EQUAL.test(digits)) return false;

  const firstCheckDigit = checkDigit(digits.slice(0, 9), 10);
  if (firstCheckDigit !== Number(digits[9])) return false;

  const secondCheckDigit = checkDigit(digits.slice(0, 10), 11);
  if (secondCheckDigit !== Number(digits[10])) return false;

  return true;
}

/** Normaliza um CPF para apenas os 11 dígitos (sem pontuação). */
export function normalizeCpf(value: string): string {
  return onlyDigits(value);
}

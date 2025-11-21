import Decimal from 'decimal.js';

/**
 * Converts a Decimal, number, or string to a string representation.
 * Handles null, undefined, and NaN gracefully.
 */
export function decimalToString(value: Decimal | number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  if (typeof value === 'string') {
    // Validate it's a valid number string
    const num = parseFloat(value);
    if (isNaN(num)) {
      return '0';
    }
    return value;
  }
  
  if (value instanceof Decimal) {
    return value.toString();
  }
  
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return '0';
    }
    return value.toString();
  }
  
  return '0';
}

/**
 * Converts a string to a Decimal instance.
 * Returns Decimal(0) if conversion fails.
 */
export function stringToDecimal(value: string | null | undefined): Decimal {
  if (!value || typeof value !== 'string') {
    return new Decimal(0);
  }
  
  try {
    return new Decimal(value);
  } catch (error) {
    return new Decimal(0);
  }
}

/**
 * Normalizes a decimal value to a string with specified decimal places.
 * Handles edge cases gracefully.
 */
export function normalizeDecimal(value: any, decimals: number = 9): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  try {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    return decimal.toFixed(decimals);
  } catch (error) {
    return '0';
  }
}

/**
 * Safely converts a value to a number, returning 0 if conversion fails.
 */
export function safeToNumber(value: any): number {
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  if (value instanceof Decimal) {
    return value.toNumber();
  }
  
  return 0;
}


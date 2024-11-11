import { v4 as uuidv4 } from 'uuid';

export function generateTrackingNumber(freightNumber) {
  // Format: {COUNTRY}-FRET{XXXX}-{RANDOM}
  // Example: FR-FRET0001-HYYC
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  // Extract country code and number from freight number (e.g., "FR-FRET-0001")
  const [country, , number] = freightNumber.split('-');
  
  // Create tracking number in format: FR-FRET0001-HYYC
  return `${country}-FRET${number}-${random}`;
}

export function formatFreightNumber(origin, number) {
  // Format: {COUNTRY}-FRET-{XXXX}
  // Example: FR-FRET-0001
  const prefix = origin.substring(0, 2).toUpperCase();
  const paddedNumber = number.toString().padStart(4, '0');
  return `${prefix}-FRET-${paddedNumber}`;
}
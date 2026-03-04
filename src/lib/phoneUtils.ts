
/**
 * Formats a Brazilian phone number for display
 * @param phone - Phone number with DDD (area code) only
 * @returns Formatted phone number like (85) 99999-9999 or (85) 9999-9999
 */
export function formatBrazilianPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle different phone number formats
  if (digits.length <= 2) {
    return `(${digits}`;
  } else if (digits.startsWith('55') && digits.length >= 12) {
    // International format with country code: 55 85 9 9837-2658
    const ddd = digits.slice(2, 4);
    const number = digits.slice(4);
    
    if (number.length === 9) {
      // Mobile with 9: (55) 85 99837-2658
      return `(55) ${ddd} ${number.slice(0, 5)}-${number.slice(5)}`;
    } else if (number.length === 8) {
      // Landline or mobile without 9: (55) 85 9837-2658
      return `(55) ${ddd} ${number.slice(0, 4)}-${number.slice(4)}`;
    } else {
      // Other cases
      return `(55) ${ddd} ${number}`;
    }
  } else if (digits.length === 11) {
    // National format with mobile 9: (85) 99837-2658
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    // National format landline: (85) 9837-2658
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else {
    // Fallback for other lengths
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
}

/**
 * Processes a Brazilian phone number by adding the Brazil country code (55)
 * @param phone - Phone number with DDD only
 * @returns Phone number with Brazil country code (55)
 */
export function processBrazilianPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Add Brazil country code (55) if not present
  if (digits.startsWith('55')) {
    return digits;
  }
  
  // Just add country code - don't modify the number itself
  return `55${digits}`;
}

/**
 * Validates Brazilian phone number format
 * @param phone - Phone number to validate
 * @returns true if valid Brazilian phone format
 */
export function validateBrazilianPhone(phone: string): boolean {
  if (!phone) return false;
  
  const digits = phone.replace(/\D/g, '');
  
  // Should have 10 or 11 digits (DDD + 8 or 9 digits)
  // DDD: 2 digits (11-99)
  // Phone: 8 digits (old format) or 9 digits (mobile with 9)
  if (digits.length !== 10 && digits.length !== 11) return false;
  
  const ddd = parseInt(digits.slice(0, 2));
  
  // Validate DDD (Brazilian area codes)
  if (ddd < 11 || ddd > 99) return false;
  
  // For 11 digits, first digit should be 9 (mobile)
  if (digits.length === 11) {
    const firstDigit = parseInt(digits.charAt(2));
    if (firstDigit !== 9) return false;
  }
  
  return true;
}

/**
 * Formats phone number for display with country code
 * @param phone - Phone number with country code
 * @returns Formatted phone number like +55 (85) 99999-9999 or +55 (85) 9999-9999
 */
export function formatPhoneWithCountryCode(phone: string): string {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('55')) {
    if (digits.length === 12) {
      // 10 digits total (DDD + 8 digits): +55 (85) 9999-9999
      const ddd = digits.slice(2, 4);
      const number = digits.slice(4);
      return `+55 (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
    } else if (digits.length === 13) {
      // 11 digits total (DDD + 9 digits): +55 (85) 99999-9999
      const ddd = digits.slice(2, 4);
      const number = digits.slice(4);
      return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
    }
  }
  
  return phone;
}

/**
 * Normalizes a phone number for searching (removes all formatting)
 * @param phone - Phone number in any format
 * @returns Clean digits only
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Creates variations of a phone number for flexible searching
 * @param phone - Phone number to create variations for
 * @returns Array of possible phone number variations
 */
export function createPhoneVariations(phone: string): string[] {
  const digits = normalizePhoneNumber(phone);
  const variations: string[] = [digits];
  
  // Add variation with country code
  if (digits.startsWith('55')) {
    variations.push(digits.slice(2)); // Without country code
  } else if (digits.length >= 10) {
    variations.push('55' + digits); // With country code
  }
  
  // Add variations for last digits (for flexible search)
  if (digits.length >= 11) {
    variations.push(digits.slice(-11)); // Last 11 digits
    variations.push(digits.slice(-10)); // Last 10 digits
  }
  
  // Remove duplicates
  return [...new Set(variations)];
}

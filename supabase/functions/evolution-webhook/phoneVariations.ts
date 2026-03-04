
// Create phone search variations WITHOUT adding or removing digits
export function createPhoneSearchVariations(phone: string): string[] {
  const variations = new Set<string>();

  // 1. Cleaned numeric version (standard)
  const numeric = phone.replace(/\D/g, '');
  if (numeric) variations.add(numeric);

  // 2. Version with '+' prefix
  variations.add('+' + numeric);

  // 3. Variations without/with country code (BR)
  if (numeric.startsWith("55")) {
    const withoutCC = numeric.slice(2);
    variations.add(withoutCC);
    variations.add('+' + withoutCC);
  } else if (numeric.length >= 10) {
    const withCC = "55" + numeric;
    variations.add(withCC);
    variations.add('+' + withCC);
  }

  // 4. Last digits variations (DDD + Number)
  if (numeric.length >= 10) {
    variations.add(numeric.slice(-11)); // last 11 (BR mobile)
    variations.add(numeric.slice(-10)); // last 10 (BR landline)
  }

  // 5. Common formats (optional but helpful if DB has formatted numbers)
  // Example: (85) 9837-2658 or (55) 85 9837-2658
  if (numeric.length >= 10) {
    const ddd = numeric.slice(-11, -9) || numeric.slice(-10, -8);
    const rest = numeric.slice(-9);
    const prefix = rest.slice(0, rest.length - 4);
    const suffix = rest.slice(-4);

    variations.add(`(${ddd}) ${prefix}-${suffix}`);
    variations.add(`+55 (${ddd}) ${prefix}-${suffix}`);
    variations.add(`55 (${ddd}) ${prefix}-${suffix}`);
    // Also with space
    variations.add(`(${ddd})${prefix}-${suffix}`);
    variations.add(`+55${numeric.slice(-11)}`);
  }

  return Array.from(variations).filter(v => v.length > 5);
}

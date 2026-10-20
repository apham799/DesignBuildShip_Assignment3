// Form helpers. Number fields are text inputs with a numeric keyboard, so whatever
// the person typed stays in the box when there's an error.

// "12" → 12; "", "1.5", "abc" → null
export function wholeNumber(text: string): number | null {
  const t = text.trim();
  return /^\d+$/.test(t) ? Number(t) : null;
}

export type Errors<K extends string> = Partial<Record<K, string>>;

export const hasErrors = (errors: Record<string, string | undefined>) => Object.values(errors).some(Boolean);

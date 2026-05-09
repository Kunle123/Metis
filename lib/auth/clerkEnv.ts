/**
 * Transitional Clerk opt-in: when either key is missing, Metis behaves as JWT/bcrypt-only
 * (middleware and `getCurrentAuthUserFromRequest` never call Clerk helpers).
 */
export function isMetisClerkEnabled(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY?.trim() && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

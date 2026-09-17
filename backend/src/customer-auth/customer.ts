/**
 * The authenticated customer principal attached to a request by
 * {@link CustomerJwtAuthGuard} and read via {@link CurrentCustomer}. Mirrors
 * `auth/auth-user.ts`'s shape but is a distinct type — a customer principal can
 * never be passed where an `AuthUser` (staff) is expected.
 */
export interface AuthCustomer {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  /** The session this access token belongs to — used to revoke on logout. */
  sessionId: string;
}

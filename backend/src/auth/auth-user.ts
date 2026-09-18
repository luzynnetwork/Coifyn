/**
 * The authenticated staff principal attached to a request by {@link JwtAuthGuard}
 * and read via {@link CurrentUser}. Deliberately small — permission and tenant
 * resolution happen in the Application layer, not here.
 */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  /** The session this access token belongs to — used to revoke on logout. */
  sessionId: string;
}

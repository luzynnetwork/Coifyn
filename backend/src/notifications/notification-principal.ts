/**
 * Notifications serve both staff (JwtAuthGuard/AuthUser) and, once
 * customer-auth lands, customer principals over the same SSE stream and CRUD
 * routes. Application-layer classes operate on this small discriminated union
 * rather than on AuthUser directly, so a customer principal can be threaded
 * through later without touching them.
 */
export type NotificationPrincipal =
  | { kind: 'user'; id: string }
  | { kind: 'customer'; id: string };

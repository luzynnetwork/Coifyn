import { CanActivate, Injectable } from '@nestjs/common';

/**
 * Phase 0 stub — every salon seeded with all *.core flags enabled; real
 * entitlement engine lands in Phase 5. Not wired to block anything yet.
 */
@Injectable()
export class EntitlementGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomerSessionsRepo } from '../data/customer-sessions.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { CustomerTokenService } from '../lib/customer-tokens.js';
import { AuthCustomer } from '../customer.js';

/**
 * Guards every customer-portal endpoint that is not explicitly public. Mirrors
 * auth/guards/jwt-auth.guard.ts exactly, but verifies against the SEPARATE
 * customer_session table and CUSTOMER_JWT_* secret — a staff access token can
 * never pass this guard, and a customer access token can never pass
 * {@link JwtAuthGuard}.
 */
@Injectable()
export class CustomerJwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: CustomerTokenService,
    private readonly database: DatabaseService,
    private readonly sessions: CustomerSessionsRepo,
    private readonly customers: CustomersRepo,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    let claims: Awaited<ReturnType<CustomerTokenService['verifyAccess']>>;
    try {
      claims = await this.tokens.verifyAccess(header.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const customer = await this.database.withAnon(async () => {
      const session = await this.sessions.findActiveById(claims.sid);
      if (!session || session.customerId !== claims.sub) return null;
      const row = await this.customers.findById(claims.sub);
      return row && row.status === 'active' ? row : null;
    });

    if (!customer) {
      throw new UnauthorizedException('Session is no longer valid.');
    }

    const principal: AuthCustomer = {
      id: customer.id,
      email: customer.email,
      phone: customer.phone,
      displayName: customer.displayName,
      sessionId: claims.sid,
    };
    (req as Request & { customer?: AuthCustomer }).customer = principal;
    return true;
  }
}

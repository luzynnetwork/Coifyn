import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { AppConfigService } from '../../config/config.service.js';

export interface CustomerAccessClaims {
  sub: string; // customer id
  sid: string; // customer session id
  kind: 'customer'; // discriminator so a customer token can never be mistaken
  //     for a staff access token even if secrets ever collided.
}

/**
 * Customer-portal equivalent of `auth/lib/tokens.ts`. Signed with SEPARATE
 * CUSTOMER_JWT_* secrets from the staff JWT_* secrets, so a leaked staff secret
 * (or vice versa) can never mint a token for the other identity, and a customer
 * access token can never pass {@link JwtAuthGuard} nor a staff one pass
 * {@link CustomerJwtAuthGuard}.
 */
@Injectable()
export class CustomerTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccess(claims: Omit<CustomerAccessClaims, 'kind'>): Promise<string> {
    return this.jwt.signAsync(
      { ...claims, kind: 'customer' } satisfies CustomerAccessClaims,
      {
        secret: this.secret('CUSTOMER_JWT_ACCESS_SECRET'),
        expiresIn: this.config.get(
          'CUSTOMER_JWT_ACCESS_TTL',
        ) as JwtSignOptions['expiresIn'],
      },
    );
  }

  async verifyAccess(token: string): Promise<CustomerAccessClaims> {
    const claims = await this.jwt.verifyAsync<CustomerAccessClaims>(token, {
      secret: this.secret('CUSTOMER_JWT_ACCESS_SECRET'),
    });
    if (claims.kind !== 'customer') {
      throw new Error('Not a customer access token.');
    }
    return claims;
  }

  /** A fresh opaque refresh token plus its storable hash and absolute expiry. */
  newRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = randomBytes(48).toString('base64url');
    return {
      token,
      hash: this.hashRefreshToken(token),
      expiresAt: new Date(Date.now() + this.refreshTtlMs()),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private secret(key: 'CUSTOMER_JWT_ACCESS_SECRET'): string {
    const value = this.config.get(key);
    if (!value) {
      throw new Error(
        `${key} is not set — required for customer-auth to sign tokens.`,
      );
    }
    return value;
  }

  private refreshTtlMs(): number {
    const ttl = this.config.get('CUSTOMER_JWT_REFRESH_TTL'); // e.g. "30d"
    const match = /^(\d+)\s*([smhd])$/.exec(ttl.trim());
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const n = Number(match[1]);
    const unit = { s: 1e3, m: 60e3, h: 3600e3, d: 86_400e3 }[match[2]]!;
    return n * unit;
  }
}

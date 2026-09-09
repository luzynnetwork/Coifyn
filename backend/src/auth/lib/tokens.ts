import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { AppConfigService } from '../../config/config.service.js';

export interface AccessClaims {
  sub: string; // user id
  sid: string; // session id
  email: string;
}

/**
 * Access and refresh tokens are signed with SEPARATE secrets so a leaked access
 * secret cannot mint refresh tokens. The refresh token is an opaque random
 * string (not a JWT) — only its SHA-256 hash is stored, and it is rotated on
 * every use.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccess(claims: AccessClaims): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get(
        'JWT_ACCESS_TTL',
      ) as JwtSignOptions['expiresIn'],
    });
  }

  verifyAccess(token: string): Promise<AccessClaims> {
    return this.jwt.verifyAsync<AccessClaims>(token, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
    });
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

  private refreshTtlMs(): number {
    const ttl = this.config.get('JWT_REFRESH_TTL'); // e.g. "30d", "12h", "45m"
    const match = /^(\d+)\s*([smhd])$/.exec(ttl.trim());
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const n = Number(match[1]);
    const unit = { s: 1e3, m: 60e3, h: 3600e3, d: 86_400e3 }[match[2]]!;
    return n * unit;
  }
}

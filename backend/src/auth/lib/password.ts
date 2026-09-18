import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

/**
 * argon2id password hashing. Parameters are argon2's current OWASP-aligned
 * defaults; kept in one place so a future bump re-hashes on next login.
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  };

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain).catch(() => false);
  }

  /** True when the stored hash was produced with weaker parameters than current
   *  and should be re-hashed after a successful verify. */
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, this.options);
  }
}

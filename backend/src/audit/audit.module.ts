import { Global, Module } from '@nestjs/common';
import { AuditWriter } from './audit-writer.js';

/** Global — any feature module writes audit rows through {@link AuditWriter}.
 *  The read side (GET /audit) and the flagged-route interceptor land with the
 *  common cross-cutting work. */
@Global()
@Module({
  providers: [AuditWriter],
  exports: [AuditWriter],
})
export class AuditModule {}
